#!/usr/bin/env node
// Play 스토어 등록 정보의 앱 아이콘(icon)·그래픽 이미지(featureGraphic)·휴대전화 스크린샷(phoneScreenshots)을 교체한다.
// 인증·패키지 규칙은 upload-aab.mjs 와 같다.
// 사용: node tools/play/upload-listing-images.mjs [--icon store/icon-512.png] [--feature store/feature-graphic.png] [--dry-run]
//       node tools/play/upload-listing-images.mjs --screenshots a.png,b.png,...   (기존 스크린샷 전부 삭제 후 순서대로 올림)
// --screenshots 만 주면 아이콘·그래픽은 건드리지 않는다.
import { readFileSync } from "node:fs";
import { createSign, createHash } from "node:crypto";
import { homedir } from "node:os";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const dry = args.includes("--dry-run");
const shots = opt("--screenshots", "");
const files = {};
if (!shots || args.includes("--icon")) files.icon = [opt("--icon", "store/icon-512.png")];
if (!shots || args.includes("--feature")) files.featureGraphic = [opt("--feature", "store/feature-graphic.png")];
if (shots) files.phoneScreenshots = shots.split(",").filter(Boolean);

const saPath = process.env.PLAY_SA_JSON || resolve(homedir(), ".config/gaepyo/play-publisher-gaepyo-play-release.json");
const sa = JSON.parse(readFileSync(saPath, "utf8"));
const pkg = process.env.PLAY_PACKAGE || (readFileSync(resolve("android/app/build.gradle"), "utf8").match(/applicationId\s+"([^"]+)"/) || [])[1];
if (!pkg) throw new Error("applicationId not found");

const b64u = (s) => Buffer.from(s).toString("base64url");
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: "RS256", typ: "JWT", kid: sa.private_key_id }));
  const claim = b64u(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = createSign("RSA-SHA256").update(`${header}.${claim}`).sign(sa.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${header}.${claim}.${sig}` });
  const j = await r.json();
  if (!j.access_token) throw new Error(`oauth failed: ${JSON.stringify(j)}`);
  return j.access_token;
}

const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}`;
async function api(tok, method, url, body, ctype) {
  const r = await fetch(url.startsWith("http") ? url : base + url, { method, headers: { Authorization: `Bearer ${tok}`, ...(body ? { "Content-Type": ctype || "application/json" } : {}) }, body: body && !ctype ? JSON.stringify(body) : body });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

const tok = await token();
const edit = await api(tok, "POST", "/edits", {});
const { listings = [] } = await api(tok, "GET", `/edits/${edit.id}/listings`);
const langs = listings.map((l) => l.language);
console.log(`edit ${edit.id} package ${pkg} listings ${langs.join(",")}`);
for (const lang of langs) {
  for (const type of Object.keys(files)) {
    const cur = await api(tok, "GET", `/edits/${edit.id}/listings/${lang}/${type}`);
    console.log(`  pre ${lang} ${type}: ${(cur.images || []).map((i) => i.sha256?.slice(0, 12)).join(",") || "-"}`);
  }
}
if (dry) { await api(tok, "DELETE", `/edits/${edit.id}`); console.log("dry-run: edit deleted"); process.exit(0); }

const want = {};
for (const lang of langs) {
  for (const [type, paths] of Object.entries(files)) {
    await api(tok, "DELETE", `/edits/${edit.id}/listings/${lang}/${type}`);
    want[type] = [];
    for (const path of paths) {
      const bytes = readFileSync(path);
      const sha = createHash("sha256").update(bytes).digest("hex");
      want[type].push(sha);
      const up = await api(tok, "POST", `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${pkg}/edits/${edit.id}/listings/${lang}/${type}?uploadType=media`, bytes, "image/png");
      console.log(`  uploaded ${lang} ${type} ${path} sha256 ${up.image?.sha256?.slice(0, 12)} (local ${sha.slice(0, 12)})`);
    }
  }
}
await api(tok, "POST", `/edits/${edit.id}:validate`);
console.log("validate=pass");
const c = await api(tok, "POST", `/edits/${edit.id}:commit`);
console.log(`commit=pass ${c.id}`);

// 커밋 후 새 edit 로 다시 읽어 대조
const v = await api(tok, "POST", "/edits", {});
let ok = true;
for (const lang of langs) {
  for (const type of Object.keys(files)) {
    const cur = await api(tok, "GET", `/edits/${v.id}/listings/${lang}/${type}`);
    // 아이콘·그래픽은 1장, 스크린샷은 올린 순서·개수까지 같아야 한다
    const got = (cur.images || []).map((i) => i.sha256);
    const match = got.length === want[type].length && want[type].every((sha, k) => got[k] === sha);
    ok &&= match;
    console.log(`  post ${lang} ${type}: match ${match}`);
  }
}
await api(tok, "DELETE", `/edits/${v.id}`);
if (!ok) process.exit(1);
