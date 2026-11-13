// 메뉴 시트: 탭을 누르면 전체 화면으로 열리고 X 로 닫힌다. 설정·지도 등 오버레이는 프레임을 꽉 채운다(로컬 dev 전용).
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
  d.stage.area = 5; d.stage.target = gs.stageTarget(5); d.stage.progress = Math.round(d.stage.target * 0.3);
  d.votes = 5e7; d.explain = 5e4;
  Object.keys(d.facilities).forEach((id) => { d.facilities[id] = 20; });
  Object.keys(d.staff).forEach((id) => { d.staff[id] = 3; });
  localStorage.removeItem("gp-sheet-v1");
  gs.save(false);
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));
await page.waitForTimeout(1200);
for (let k = 0; k < 6; k += 1) {
  const l = page.locator(".gp-modal [data-next], .gp-modal [data-close], .gp-modal [data-confirm]");
  if (!(await l.count())) break;
  await l.first().click().catch(() => {});
  await page.waitForTimeout(150);
}
await page.addStyleTag({ content: ".gp-banner{display:none!important}" });
const state = () => page.evaluate(() => ["peek", "half", "full"].find((s) => document.querySelector(".gp-bottom").classList.contains(`gp-bottom--${s}`)));
const x = page.locator(".gp-handle__chev");
const res = { boot: await state(), tabs: {} };
for (const tab of ["facilities", "crew", "events", "goals", "prestige"]) {
  await page.locator(`.gp-tab[data-tab="${tab}"]`).click();
  await page.waitForTimeout(300);
  const opened = await state();
  const label = await x.getAttribute("aria-label");
  const box = await x.boundingBox();
  await x.click();
  await page.waitForTimeout(300);
  res.tabs[tab] = { opened, label, xSize: [Math.round(box.width), Math.round(box.height)], closed: await state() };
}
// 같은 탭 다시 누르기: 접힘 ↔ 전체
await page.locator('.gp-tab[data-tab="prestige"]').click(); await page.waitForTimeout(250);
res.sameTabOpen = await state();
await page.locator('.gp-tab[data-tab="prestige"]').click(); await page.waitForTimeout(250);
res.sameTabClose = await state();
// 월드 오브젝트 탭 경로(gp:sheet-open)는 일부 펼침 + X 로 닫힘
await page.evaluate(() => document.dispatchEvent(new CustomEvent("gp:sheet-open", { detail: { tab: "facilities" } })));
await page.waitForTimeout(250);
res.worldOpen = await state();
await x.click(); await page.waitForTimeout(250);
res.worldClosed = await state();
// 뒤로 가기(gp:sheet-collapse): 전체 → 접힘
await page.locator('.gp-tab[data-tab="crew"]').click(); await page.waitForTimeout(250);
await page.evaluate(() => document.dispatchEvent(new CustomEvent("gp:sheet-collapse")));
await page.waitForTimeout(250);
res.backClosed = await state();
// 오버레이: 프레임을 꽉 채우고 X 로 닫힌다
const overlay = async (open) => {
  await page.evaluate(open);
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const ov = [...document.querySelectorAll(".gp-map-ov")].find((o) => !o.hidden && o.offsetParent !== null);
    const m = ov?.querySelector(".gp-map"); const ui = document.querySelector(".gp-ui");
    return m ? { fill: m.offsetWidth === ui.offsetWidth && m.offsetHeight === ui.offsetHeight, hasX: !!ov.querySelector(".gp-map__x") } : null;
  });
  await page.evaluate(() => [...document.querySelectorAll(".gp-map-ov")].find((o) => !o.hidden && o.offsetParent !== null)?.querySelector(".gp-map__x")?.click());
  await page.waitForTimeout(300);
  const stillOpen = await page.evaluate(() => [...document.querySelectorAll(".gp-map-ov")].some((o) => !o.hidden && o.offsetParent !== null));
  return { ...r, closed: !stillOpen };
};
res.settings = await overlay(() => document.querySelector(".gp-mute").click());
res.map = await overlay(() => document.dispatchEvent(new CustomEvent("gp:open-map")));
res.special = await overlay(() => document.querySelector(".gp-special-chip")?.click());
// 닫을 수 있는 팝업(작전 현황)에는 X 가 있다
await page.evaluate(() => document.dispatchEvent(new CustomEvent("gp:open-operations")));
await page.waitForTimeout(400);
res.popupX = await page.locator(".gp-modal .gp-modal__x").count();
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
if (res.popupX) await page.locator(".gp-modal .gp-modal__x").click();
await page.waitForTimeout(250);
res.popupClosed = (await page.locator(".gp-modal-ov").count()) === 0;
const tabsOk = Object.values(res.tabs).every((t) => t.opened === "full" && t.closed === "peek" && t.label === "닫기" && t.xSize[0] >= 44 && t.xSize[1] >= 44);
const ovOk = [res.settings, res.map, res.special].every((o) => o && o.fill && o.hasX && o.closed);
const ok = res.boot === "peek" && tabsOk && res.sameTabOpen === "full" && res.sameTabClose === "peek" && res.worldOpen === "half" && res.worldClosed === "peek" && res.backClosed === "peek" && ovOk && res.popupX === 1 && res.popupClosed;
console.log(JSON.stringify({ ok, ...res }));
await browser.close();
process.exit(ok ? 0 : 1);
