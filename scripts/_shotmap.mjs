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
// 구역 5로 진행
await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  gs.data.stage.area = 5;
  gs.data.stage.progress = Math.floor((gs.data.stage.target || 1000) * 0.4);
  gs.data.votes = 5e6;
  gs.emit("changed");
});
await p.waitForTimeout(400);
// 지도 열기: 이벤트 직접 디스패치(간판 zone과 동일 동작)
await p.evaluate(() => document.dispatchEvent(new CustomEvent("gp:open-map")));
await p.waitForTimeout(700);
await p.screenshot({ path: "/tmp/gp-map.png" });
const visible = await p.evaluate(() => { const e = document.querySelector(".gp-map-ov"); return e && !e.hidden; });
console.log("errs:", errs.length, "mapVisible:", visible);
errs.slice(0, 6).forEach((e) => console.log("  " + e));
await b.close();
