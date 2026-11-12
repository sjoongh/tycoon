#!/usr/bin/env node
// Play 스토어 등록 정보(ko-KR)의 짧은 설명·전체 설명을 store/STORE_LISTING.md 와 맞춘다. 인증·패키지 규칙은 upload-aab.mjs 와 같다.
// 사용: node tools/play/update-listing-text.mjs [--lang ko-KR] [--dry-run]
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const lang = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : "ko-KR";
const dry = args.includes("--dry-run");

const md = readFileSync(resolve("store/STORE_LISTING.md"), "utf8");
const section = (title) => {
  const m = md.match(new RegExp(`## ${title}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`));
  if (!m) throw new Error(`section not found: ${title}`);
  return m[1].trim();
};
const want = { title: section("앱 이름"), shortDescription: section("짧은 설명"), fullDescription: section("전체 설명") };
if ([...want.shortDescription].length > 80) throw new Error(`짧은 설명 ${[...want.shortDescription].length}자 > 80`);
if ([...want.fullDescription].length > 4000) throw new Error(`전체 설명 ${[...want.fullDescription].length}자 > 4000`);

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
async function api(tok, method, url, body) {
  const r = await fetch(base + url, { method, headers: { Authorization: `Bearer ${tok}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

const same = (cur) => Object.keys(want).every((k) => cur[k] === want[k]);
const tok = await token();
const edit = await api(tok, "POST", "/edits", {});
const cur = await api(tok, "GET", `/edits/${edit.id}/listings/${lang}`);
console.log(`edit ${edit.id} ${pkg} ${lang}: short ${[...want.shortDescription].length}자, full ${[...want.fullDescription].length}자, 현재와 같음 ${same(cur)}`);
if (dry || same(cur)) { await api(tok, "DELETE", `/edits/${edit.id}`); console.log(dry ? "dry-run: edit deleted" : "변경 없음"); process.exit(0); }

await api(tok, "PATCH", `/edits/${edit.id}/listings/${lang}`, want);
await api(tok, "POST", `/edits/${edit.id}:validate`);
console.log("validate=pass");
const c = await api(tok, "POST", `/edits/${edit.id}:commit`);
console.log(`commit=pass ${c.id}`);

// 커밋 후 새 edit 로 다시 읽어 대조
const v = await api(tok, "POST", "/edits", {});
const after = await api(tok, "GET", `/edits/${v.id}/listings/${lang}`);
await api(tok, "DELETE", `/edits/${v.id}`);
console.log(`post ${lang}: match ${same(after)}`);
if (!same(after)) process.exit(1);
