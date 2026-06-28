// 세이브 영속성 회귀 테스트 — 사건 도감(seenEvents)이 저장→리로드→감사(프레스티지)를 거쳐
// 보존되는지 e2e로 검증한다. 플레이어 진척 손실은 최고 심각도라 별도 가드를 둔다.
// 사용: dev 서버(5178) 켠 상태에서 `node scripts/_savecheck.mjs`. 실패 시 exit 1.
import { chromium } from "playwright";

const URL = "http://localhost:5178/";
const SAVE_KEY = "trust-office-phaser-v2";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("C:" + m.text()); });

async function boot() {
  await p.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) {
    const s = await p.$(".gp-skip"); if (s) { await s.click().catch(() => {}); await p.waitForTimeout(150); }
    if (await p.$(".gp-modal-ov")) { const b2 = await p.$(".gp-modal .gp-btn"); if (b2) await b2.click().catch(() => {}); await p.waitForTimeout(150); }
    else break;
  }
}

const fails = [];
const expect = (cond, msg) => { if (!cond) fails.push(msg); };

await p.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: "networkidle" }); await boot();

// 1) 수집 + 저장 → localStorage에 seenEvents/titles 기록
const s1 = await p.evaluate((KEY) => {
  const gs = window.__game.registry.get("gameState");
  ["recount-demand", "phishing-text", "blackout-poll", "ghost-voter", "interim-tally"].forEach((id) => gs.markEventSeen(id));
  gs.data.titles = { intern: 3, director: 2 }; gs.data.titleDraws = 9; gs.data.equippedTitle = "director"; // 칭호 컬렉션 시드
  gs.save(false);
  const raw = JSON.parse(localStorage.getItem(KEY));
  return { seenCount: gs.seenEventCount(), savedKeys: Object.keys(raw.seenEvents || {}).length, savedTitleKeys: Object.keys(raw.titles || {}).length, savedDraws: raw.titleDraws };
}, SAVE_KEY);
expect(s1.seenCount === 5, `수집 카운트 5 기대, 실제 ${s1.seenCount}`);
expect(s1.savedKeys === 5, `저장된 seenEvents 5 기대, 실제 ${s1.savedKeys}`);
expect(s1.savedTitleKeys === 2, `저장된 titles 2 기대, 실제 ${s1.savedTitleKeys}`);
expect(s1.savedDraws === 9, `저장된 titleDraws 9 기대, 실제 ${s1.savedDraws}`);

// 2) 리로드 후 복원
await p.reload({ waitUntil: "networkidle" }); await boot();
const s2 = await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  return { afterReload: gs.seenEventCount(), hasPhishing: gs.hasSeenEvent("phishing-text"), titlesOwned: gs.ownedTitleCount(), draws: gs.data.titleDraws, eq: gs.data.equippedTitle };
});
expect(s2.afterReload === 5, `리로드 후 5 기대, 실제 ${s2.afterReload}`);
expect(s2.hasPhishing === true, "리로드 후 phishing-text 보존 실패");
expect(s2.titlesOwned === 2, `리로드 후 칭호 2종 기대, 실제 ${s2.titlesOwned}`);
expect(s2.draws === 9 && s2.eq === "director", "리로드 후 titleDraws/대표칭호 보존 실패");

// 3) 감사(프레스티지) 후 보존
const s3 = await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  gs.data.stage.area = 5; gs.data.facilities.desk = 20; gs.emit("changed");
  const ok = gs.prestigeReset();
  return { prestigeOk: ok, afterPrestige: gs.seenEventCount(), stillHas: gs.hasSeenEvent("phishing-text") };
});
expect(s3.prestigeOk === true, "프레스티지 실행 실패");
expect(s3.afterPrestige === 5, `감사 후 5 보존 기대, 실제 ${s3.afterPrestige}`);
expect(s3.stillHas === true, "감사 후 phishing-text 보존 실패");

// 4) 공산주의 하드 리셋 후에도 메타(도감/칭호) 보존 + 코어 초기화
const s4 = await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  gs.data.stage.area = 6; gs.data.facilities.desk = 25; gs.emit("changed");
  const ok = gs.communistReset();
  return { ok, dex: gs.seenEventCount(), titles: gs.ownedTitleCount(), area: gs.data.stage.area, desk: gs.data.facilities.desk, collapses: gs.data.stats.collapses };
});
expect(s4.ok === true, "공산주의 리셋 실행 실패");
expect(s4.dex === 5, `전복 후 도감 5 보존 기대, 실제 ${s4.dex}`);
expect(s4.titles === 2, `전복 후 칭호 2종 보존 기대, 실제 ${s4.titles}`);
expect(s4.area === 1 && s4.desk <= 1, `전복 후 코어 초기화 기대(area1/desk≤1), 실제 area${s4.area}/desk${s4.desk}`);
expect(s4.collapses === 1, `전복 횟수 1 기대, 실제 ${s4.collapses}`);

expect(errs.length === 0, `콘솔/페이지 에러 ${errs.length}건: ${errs.slice(0, 3).join(" | ")}`);

await b.close();

if (fails.length) {
  console.log("SAVE PERSISTENCE: FAIL");
  fails.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
console.log("SAVE PERSISTENCE OK — 도감/칭호 저장·리로드·감사·전복 보존 검증 통과");
