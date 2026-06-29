import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("C:" + m.text()); });
await p.goto("http://localhost:5178/", { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(2000);
for (let i = 0; i < 6; i++) {
  const s = await p.$(".gp-skip"); if (s) { await s.click().catch(() => {}); await p.waitForTimeout(200); }
  if (await p.$(".gp-modal-ov")) { const b2 = await p.$(".gp-modal .gp-btn"); if (b2) await b2.click().catch(() => {}); await p.waitForTimeout(200); } else break;
}
const seen = await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  gs.data.stage.area = 5;
  gs.data.votes = 5e6;
  // 사건 도감: 일부 사건을 수집 처리하고, 첫수집 1건 검증
  import("/src/data/events.js").then(() => {});
  return null;
});
// markEventSeen 직접 호출 — 절반쯤 수집
await p.evaluate(async () => {
  const gs = window.__game.registry.get("gameState");
  const mod = await import("/src/data/events.js");
  mod.officeEvents.forEach((ev, i) => { if (i % 2 === 0) gs.markEventSeen(ev.id); });
  return gs.seenEventCount();
});
await p.waitForTimeout(300);
await p.evaluate(() => document.dispatchEvent(new CustomEvent("gp:open-map")));
await p.waitForTimeout(700);
// 도감 영역까지 스크롤
await p.evaluate(() => { const l = document.querySelector(".gp-map__list"); if (l) l.scrollTop = l.scrollHeight; });
await p.waitForTimeout(300);
await p.screenshot({ path: "/tmp/gp-dex.png" });
const info = await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  return { count: gs.seenEventCount(), cells: document.querySelectorAll(".gp-dex__cell").length, lock: document.querySelectorAll(".gp-dex__cell--lock").length };
});
console.log("errs:", errs.length, JSON.stringify(info));
errs.slice(0, 6).forEach((e) => console.log("  " + e));
await b.close();
