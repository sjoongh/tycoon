import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("C:" + m.text()); });
await p.goto("http://localhost:5178/", { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(2000);
for (let i = 0; i < 6; i++) {
  const s = await p.$(".gp-skip"); if (s) { await s.click().catch(() => {}); await p.waitForTimeout(220); }
  if (await p.$(".gp-modal-ov")) { const b2 = await p.$(".gp-modal .gp-btn"); if (b2) await b2.click().catch(() => {}); await p.waitForTimeout(220); } else break;
}
await p.waitForTimeout(600);
// 빠른 연타로 콤보 유발
for (let i = 0; i < 6; i++) { await p.mouse.click(195, 400); await p.waitForTimeout(120); }
await p.waitForTimeout(150);
await p.screenshot({ path: "/tmp/gp-juice.png" });
// x10 토글 눌러보기
const q10 = await p.$('.gp-qtybtn[data-id="10"]');
if (q10) { await q10.click(); await p.waitForTimeout(400); }
await p.screenshot({ path: "/tmp/gp-juice-x10.png" });
console.log("errs:", errs.length, "qtyToggle:", !!q10);
errs.slice(0, 6).forEach((e) => console.log("  " + e));
await b.close();
