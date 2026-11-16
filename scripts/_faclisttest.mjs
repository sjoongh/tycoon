// 시설 탭 카드 목록: 각 카드의 업그레이드 버튼이 그 시설만 올리고, 카드를 누르면 선택되며,
// 월드에서 시설을 고르면(일부 펼침) 그 카드가 보이도록 스크롤된다(로컬 dev 전용).
import { chromium } from "playwright";
const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
if (!["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname)) throw new Error("local only");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
await page.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  const d = gs.data;
  d.tutorial = { step: 5, done: true, openingSeen: true };
  d.stage.area = 6; d.stage.target = gs.stageTarget(6); d.stage.progress = 0;
  d.votes = 1e12; d.explain = 1e9;
  Object.keys(d.facilities).forEach((id) => { d.facilities[id] = 10; });
  d.selected = "desk";
  gs.save(false);
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
await page.waitForTimeout(1200);
for (let k = 0; k < 8; k += 1) {
  const l = page.locator(".gp-modal [data-skip], .gp-modal [data-next], .gp-modal [data-close], .gp-modal [data-confirm]");
  if (!(await l.count())) break;
  await l.first().click().catch(() => {});
  await page.waitForTimeout(150);
}
await page.addStyleTag({ content: ".gp-banner{display:none!important}" });
const lv = () => page.evaluate(() => ({ ...window.__game.registry.get("gameState").data.facilities }));
const sel = () => page.evaluate(() => window.__game.registry.get("gameState").data.selected);
await page.evaluate(() => { window.__game.registry.get("gameState").data.paused = true; document.querySelector('.gp-tab[data-tab="facilities"]').click(); });
await page.waitForTimeout(400);
const res = {};
res.cards = await page.locator(".gp-faccard").count();
res.buttons = await page.locator('.gp-faccard [data-action="upgradeFac"]').count();
const before = await lv();
const target = await page.evaluate(() => [...document.querySelectorAll('.gp-faccard [data-action="upgradeFac"]')].map((b) => b.dataset.id).find((id) => id !== "desk"));
await page.locator(`.gp-faccard [data-action="upgradeFac"][data-id="${target}"]`).click();
await page.waitForTimeout(300);
const after = await lv();
res.target = target;
res.onlyTargetRaised = after[target] === before[target] + 1 && Object.keys(before).every((id) => id === target || after[id] === before[id]);
res.selectedAfterBuy = await sel();
// x10 으로 다시 사기
await page.locator('.gp-qtybtn[data-id="10"]').click(); await page.waitForTimeout(200);
await page.locator('.gp-faccard [data-action="upgradeFac"][data-id="desk"]').click(); await page.waitForTimeout(300);
res.deskX10 = (await lv()).desk - after.desk;
// 카드 본문 누르면 선택
const lastId = await page.evaluate(() => [...document.querySelectorAll(".gp-faccard[data-action='selectFac']")].at(-1).dataset.id);
await page.locator(`.gp-faccard[data-fac="${lastId}"] .gp-card__body`).click(); await page.waitForTimeout(250);
res.selectedByCard = (await sel()) === lastId;
// 월드 선택 경로: 접고 → 첫 시설 선택 + 일부 펼침 → 카드가 보이는지
await page.locator(".gp-handle__chev").click(); await page.waitForTimeout(250);
await page.evaluate(() => { const gs = window.__game.registry.get("gameState"); gs.select("desk"); document.dispatchEvent(new CustomEvent("gp:sheet-open", { detail: { tab: "facilities" } })); });
await page.waitForTimeout(500);
res.halfVisible = await page.evaluate(() => { const c = document.querySelector('.gp-faccard[data-fac="desk"]').getBoundingClientRect(); const p = document.querySelector(".gp-panel").getBoundingClientRect(); return c.top >= p.top - 1 && c.bottom <= p.bottom + 1; });
// 매초 패치 경로에서 버튼 문구가 유지되는지(재렌더 없이)
const firstHtml = await page.evaluate(() => document.querySelector(".gp-faclist").firstElementChild.outerHTML.length);
await page.evaluate(() => { const gs = window.__game.registry.get("gameState"); gs.data.paused = false; });
await page.waitForTimeout(2200);
res.patchedStable = await page.evaluate((n) => Math.abs(document.querySelector(".gp-faclist").firstElementChild.outerHTML.length - n) < 40, firstHtml);
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
const ok = res.cards === 6 && res.buttons >= 2 && res.onlyTargetRaised && res.selectedAfterBuy === target && res.deskX10 === 10 && res.selectedByCard && res.halfVisible && res.patchedStable;
console.log(JSON.stringify({ ok, ...res }));
await browser.close();
process.exit(ok ? 0 : 1);
