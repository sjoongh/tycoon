// 갱신 제안("새 공문 도착"): 팝업·전체 화면 메뉴가 떠 있는 동안에는 숨고, 닫히면 나타난다(로컬 dev 전용).
import { chromium } from "playwright";
const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
if (!["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname)) throw new Error("local only");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
// 복귀 정산 팝업이 뜨도록 2시간 전 세이브를 심는다
await page.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  const d = gs.data;
  d.tutorial = { step: 5, done: true, openingSeen: true };
  d.stage.area = 2; d.stage.target = gs.stageTarget(2); d.stage.progress = 0;
  Object.keys(d.facilities).forEach((id) => { d.facilities[id] = 6; });
  gs.save(false);
  const key = "trust-office-phaser-v2";
  const saved = JSON.parse(localStorage.getItem(key));
  saved.lastSeenAt = Date.now() - 2 * 3600 * 1000; saved.lastSavedAt = saved.lastSeenAt;
  localStorage.setItem(key, JSON.stringify(saved));
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState") && window.__pwaUpdates && document.querySelector(".gp-update"));
await page.waitForTimeout(1200);
const shown = () => page.evaluate(() => { const el = document.querySelector(".gp-update"); return !el.hidden && getComputedStyle(el).display !== "none"; });
const res = {};
res.modalAtBoot = await page.locator(".gp-modal-ov").count();
await page.evaluate(() => { const c = window.__pwaUpdates; c.waitingWorker = { postMessage() {} }; c.dismissed = false; c.dispatchEvent(new Event("change")); });
await page.waitForTimeout(600);
res.hiddenWhileModal = !(await shown());
if (process.env.SHOT) await page.screenshot({ path: `${process.env.SHOT}-modal.png` });
for (let k = 0; k < 8; k += 1) {
  const l = page.locator(".gp-modal [data-close], .gp-modal [data-confirm], .gp-modal [data-next]");
  if (!(await l.count())) break;
  await l.first().click().catch(() => {});
  await page.waitForTimeout(200);
}
await page.waitForTimeout(900);
res.modalsLeft = await page.locator(".gp-modal-ov").count();
res.shownAfterModal = await shown();
if (process.env.SHOT) await page.screenshot({ path: `${process.env.SHOT}-world.png` });
await page.evaluate(() => document.querySelector('.gp-tab[data-tab="facilities"]').click());
await page.waitForTimeout(500);
res.hiddenInFullMenu = !(await shown());
await page.locator(".gp-handle__chev").click();
await page.waitForTimeout(500);
res.shownAfterMenu = await shown();
await page.locator('[data-update="later"]').click();
await page.waitForTimeout(600);
res.hiddenAfterLater = !(await shown());
const ok = res.modalAtBoot >= 1 && res.hiddenWhileModal && res.modalsLeft === 0 && res.shownAfterModal && res.hiddenInFullMenu && res.shownAfterMenu && res.hiddenAfterLater;
console.log(JSON.stringify({ ok, ...res }));
await browser.close();
process.exit(ok ? 0 : 1);
