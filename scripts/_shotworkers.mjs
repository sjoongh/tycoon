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
// 자원 주입 + 전 직원 채용(직접)
const hired = await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  gs.data.votes = 1e9; gs.data.explain = 1e6;
  const ids = Object.keys(gs.data.staff || {});
  ids.forEach((id) => { gs.data.staff[id] = 3; });
  gs.emit("changed");
  return ids;
});
await p.waitForTimeout(1200);
const hireBtns = hired;
// 시설 탭으로 돌아가 메인 월드 확인
for (const t of (await p.$$(".gp-tab"))) { if ((await t.innerText()).includes("시설")) { await t.click(); break; } }
await p.waitForTimeout(1200);
await p.screenshot({ path: "/tmp/gp-workers.png" });
console.log("errs:", errs.length, "hireBtns:", hireBtns.length);
errs.slice(0, 6).forEach((e) => console.log("  " + e));
await b.close();
