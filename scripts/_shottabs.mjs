import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("C:" + m.text()); });
await p.goto("http://localhost:5178/", { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(2000);
for (let i = 0; i < 6; i++) {
  const s = await p.$(".gp-skip");
  if (s) { await s.click().catch(() => {}); await p.waitForTimeout(250); }
  if (await p.$(".gp-modal-ov")) { const b2 = await p.$(".gp-modal .gp-btn"); if (b2) await b2.click().catch(() => {}); await p.waitForTimeout(250); }
  else break;
}
await p.waitForTimeout(800);
async function tab(name, file) {
  const tabs = await p.$$(".gp-tab");
  for (const t of tabs) {
    const tx = (await t.innerText()).replace(/\s/g, "");
    if (tx.includes(name)) { await t.click(); break; }
  }
  await p.waitForTimeout(900);
  await p.screenshot({ path: file });
}
await tab("사건", "/tmp/gp-tab-events.png");
await tab("직원", "/tmp/gp-tab-crew.png");
await tab("감사", "/tmp/gp-tab-prestige.png");
console.log("errs:", errs.length);
errs.slice(0, 6).forEach((e) => console.log("  " + e));
await b.close();
