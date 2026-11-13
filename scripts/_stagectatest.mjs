// HUD 단계 칩: 구역 목표를 채우면 다음 구역 버튼이 되고, 누르면 구역이 오른다(로컬 dev 전용).
import { chromium } from "playwright";
const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
if (!["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname)) throw new Error("local only");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
const seed = (ratio) => page.evaluate((ratio) => {
  const gs = window.__game.registry.get("gameState");
  const d = gs.data;
  d.tutorial = { step: 5, done: true, openingSeen: true };
  d.stage.area = 4; d.stage.target = gs.stageTarget(4); d.stage.progress = Math.round(d.stage.target * ratio);
  gs.save(false);
}, ratio);
const boot = async () => {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"));
  await page.waitForTimeout(1200);
  for (let k = 0; k < 6; k += 1) {
    const l = page.locator(".gp-modal [data-next], .gp-modal [data-close], .gp-modal [data-confirm]");
    if (!(await l.count())) break;
    await l.first().click().catch(() => {});
    await page.waitForTimeout(150);
  }
};
const read = () => page.evaluate(() => {
  const el = document.querySelector('.gp-stage[data-k="stage"]');
  return { text: el.textContent, ready: el.classList.contains("gp-stage--ready"), pe: getComputedStyle(el).pointerEvents, area: window.__game.registry.get("gameState").data.stage.area };
});
await seed(0.4); await boot();
const idle = await read();
await page.locator(".gp-stage").click({ force: true, timeout: 2000 }).catch(() => {});
const idleAfter = await read();
await seed(1); await boot();
const ready = await read();
await page.locator(".gp-stage").click();
await page.waitForTimeout(600);
const after = await read();
const ok = !idle.ready && idle.pe === "none" && idleAfter.area === 4 && ready.ready && ready.text.includes("다음 구역") && after.area === 5 && !after.ready;
console.log(JSON.stringify({ ok, idle, idleAfter, ready, after }));
await browser.close();
process.exit(ok ? 0 : 1);
