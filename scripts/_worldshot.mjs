// 월드 화면 캡처(로컬 dev 전용): AREA·OUT 환경변수로 구역을 맞춘 세이브를 심고 다시 불러온 뒤 캡처한다.
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5179";
if (!["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname)) throw new Error("local only");
const area = Number(process.env.AREA || 4);
const out = process.env.OUT || `.qa-test-automations/evidence/2026-11-12/screenshots/WORLD-a${area}.png`;
const scale = Number(process.env.DSF || 1);
await mkdir(out.replace(/\/[^/]+$/, ""), { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale });
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERR ${e.message}`));
const closeModals = async () => {
  for (let k = 0; k < 6; k += 1) {
    for (const sel of [".gp-modal [data-next]", ".gp-modal [data-close]", ".gp-modal [data-confirm]"]) {
      const l = page.locator(sel);
      if (await l.count()) { await l.first().click().catch(() => {}); break; }
    }
    await page.waitForTimeout(80);
  }
};
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
await page.evaluate((area) => {
  const gs = window.__game.registry.get("gameState");
  const d = gs.data;
  d.tutorial = { step: 5, done: true, openingSeen: true };
  d.stage.area = area; d.stage.target = gs.stageTarget(area); d.stage.progress = Math.round(d.stage.target * 0.4);
  d.votes = 1e7 * area; d.explain = 5e4;
  const lv = Math.min(60, 8 + area * 4);
  Object.keys(d.facilities).forEach((id) => { d.facilities[id] = lv; });
  Object.keys(d.staff).forEach((id) => { d.staff[id] = Math.min(10, area); });
  gs.save(false);
}, area);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
await page.waitForTimeout(1500);
await closeModals();
await page.waitForTimeout(900);
if (process.env.ACTION) await page.evaluate(process.env.ACTION);
// DRAG="dx,dy": 화면 가운데에서 실제 마우스로 끌어 카메라 팬을 확인
if (process.env.DRAG) {
  const [dx, dy] = process.env.DRAG.split(",").map(Number);
  await page.mouse.move(195, 300);
  await page.mouse.down();
  for (let k = 1; k <= 12; k += 1) { await page.mouse.move(195 + (dx * k) / 12, 300 + (dy * k) / 12); await page.waitForTimeout(16); }
  await page.mouse.up();
}
await page.waitForTimeout(Number(process.env.WAIT || 300));
// CLEAN=1: 업적·알림 배너를 가리고 캡처(스토어 스크린샷용)
if (process.env.CLEAN) await page.addStyleTag({ content: ".gp-banner{display:none!important}" });
await page.screenshot({ path: out });
const cam = await page.evaluate(() => { const w = window.__game.scene.getScene("GameScene").world; return w._pan ? { pan: w._pan, zoom: w._camZoom, votes: Math.round(w.gameState.data.votes), dbg: window.__dbg } : null; });
console.log(JSON.stringify({ out, errors, cam }));
await browser.close();
