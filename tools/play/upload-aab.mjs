#!/usr/bin/env node
// Play Developer API로 서명 AAB를 업로드하고 트랙을 completed로 설정한다(의존성 없음, node crypto JWT).
// 사용: node tools/play/upload-aab.mjs <aab> --tracks internal,production [--dry-run]
// 키: PLAY_SA_JSON(기본 ~/.config/gaepyo/play-publisher-gaepyo-play-release.json), 패키지: PLAY_PACKAGE(기본 build.gradle applicationId)
import { readFileSync, statSync } from "node:fs";
import { createSign, createHash } from "node:crypto";
import { homedir } from "node:os";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const aab = args.find((a) => !a.startsWith("--"));
const tracks = (args[args.indexOf("--tracks") + 1] || "internal").split(",").filter((t) => args.includes("--tracks"));
const dry = args.includes("--dry-run");
if (!aab) { console.error("usage: upload-aab.mjs <aab> --tracks internal,production"); process.exit(2); }

const saPath = process.env.PLAY_SA_JSON || resolve(homedir(), ".config/gaepyo/play-publisher-gaepyo-play-release.json");
const sa = JSON.parse(readFileSync(saPath, "utf8"));
const pkg = process.env.PLAY_PACKAGE || (readFileSync(resolve("android/app/build.gradle"), "utf8").match(/applicationId\s+"([^"]+)"/) || [])[1];
if (!pkg) throw new Error("applicationId not found");
const bytes = readFileSync(aab);
const sha256 = createHash("sha256").update(bytes).digest("hex");
console.log(`aab ${aab} ${statSync(aab).size} bytes sha256 ${sha256}\npackage ${pkg} tracks ${tracks.join(",")}${dry ? " (dry-run)" : ""}`);

const b64u = (s) => Buffer.from(s).toString("base64url");
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: "RS256", typ: "JWT", kid: sa.private_key_id }));
  const claim = b64u(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = createSign("RSA-SHA256").update(`${header}.${claim}`).sign(sa.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${header}.${claim}.${sig}` });
  const j = await r.json();
  if (!j.access_token) throw new Error(`oauth failed: ${JSON.stringify(j)}`);
  console.log("oauth=pass");
  return j.access_token;
}

const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}`;
async function api(tok, method, path, body, raw) {
  const r = await fetch((raw ? "" : base) + path, { method, headers: { Authorization: `Bearer ${tok}`, ...(body && !Buffer.isBuffer(body) ? { "Content-Type": "application/json" } : {}), ...(Buffer.isBuffer(body) ? { "Content-Type": "application/octet-stream" } : {}) }, body: body && !Buffer.isBuffer(body) ? JSON.stringify(body) : body });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}
const fmt = (t) => (t.releases || []).map((rel) => `${rel.status} ${rel.name} vc=${(rel.versionCodes || []).join("/")}`).join("; ");
async function snapshot(tok, editId) {
  const all = await api(tok, "GET", `/edits/${editId}/tracks`);
  for (const t of all.tracks || []) console.log(`  ${t.track}: [${fmt(t)}]`);
}

const tok = await token();
let edit = await api(tok, "POST", "/edits", {});
console.log(`edit ${edit.id}\npre:`);
await snapshot(tok, edit.id);
if (dry) { await api(tok, "DELETE", `/edits/${edit.id}`); console.log("dry-run: edit deleted"); process.exit(0); }

const up = await api(tok, "POST", `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${pkg}/edits/${edit.id}/bundles?uploadType=media`, bytes, true);
console.log(`uploaded versionCode ${up.versionCode} sha256 ${up.sha256}`);
if (up.sha256 !== sha256) throw new Error("sha256 mismatch after upload");
const versionName = (readFileSync(resolve("android/app/build.gradle"), "utf8").match(/versionName\s+"([^"]+)"/) || [])[1] || String(up.versionCode);
for (const track of tracks) {
  const res = await api(tok, "PUT", `/edits/${edit.id}/tracks/${track}`, { track, releases: [{ name: `${up.versionCode} (${versionName})`, status: "completed", versionCodes: [String(up.versionCode)] }] });
  console.log(`${track} set: [${fmt(res)}]`);
}
await api(tok, "POST", `/edits/${edit.id}:validate`);
console.log("validate=pass");
await api(tok, "POST", `/edits/${edit.id}:commit`);
console.log(`commit=pass ${edit.id}`);

// 재조회로 검증
const edit2 = await api(tok, "POST", "/edits", {});
const b = await api(tok, "GET", `/edits/${edit2.id}/bundles`);
const found = (b.bundles || []).find((x) => x.versionCode === up.versionCode);
console.log(`verify bundle${up.versionCode} sha match: ${found?.sha256 === sha256}\npost:`);
await snapshot(tok, edit2.id);
await api(tok, "DELETE", `/edits/${edit2.id}`);
console.log("verify edit deleted");
