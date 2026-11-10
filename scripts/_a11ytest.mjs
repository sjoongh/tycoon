// 접근성 옵션 E2E(로드맵 #15): 큰 글씨·움직임 줄이기 토글 → html 클래스·글자 크기·44px 터치 영역·새로고침 유지·월드 장식 효과 생략을 확인한다.
// 실행: npm run dev(5178) 후 `node scripts/_a11ytest.mjs`
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run E2E against non-local host: ${parsedUrl.hostname}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game?.registry.get("gameState") && document.querySelector(".gp-hud"));
  const skip = page.locator("[data-skip]");
  if (await skip.count()) await skip.click();

  const px = (sel) => page.evaluate((s) => Number.parseFloat(getComputedStyle(document.querySelector(s)).fontSize), sel);
  const rect = (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }, sel);

  const before = { tab: await px(".gp-tab"), cardSub: await px(".gp-card__sub"), tabRect: await rect(".gp-tab"), qty: await rect(".gp-qtybtn") };
  await page.locator(".gp-mute").click();
  const settingsBtn = await rect('[data-set="bigtext"]');
  await page.locator('[data-set="bigtext"]').click();
  await page.locator('[data-set="reducemotion"]').click();
  const cls = await page.evaluate(() => document.documentElement.className);
  const stored = await page.evaluate(() => localStorage.getItem("gp-a11y-v1"));
  await page.locator(".gp-map__x").click();
  const after = {
    tab: await px(".gp-tab"),
    cardSub: await px(".gp-card__sub"),
    progressTransition: await page.evaluate(() => getComputedStyle(document.querySelector(".gp-progress__fill")).transitionDuration),
  };
  await page.screenshot({ path: "/tmp/gaepyo-a11y-bigtext.png" });

  // 새로고침 후에도 설정이 유지되어야 한다
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState") && document.querySelector(".gp-hud"));
  const persisted = await page.evaluate(() => document.documentElement.className);

  // 움직임 줄이기 중에는 탭해도 비행 표 장식 효과가 생성되지 않는다
  await page.mouse.click(195, 300);
  await page.mouse.click(195, 300);
  await page.waitForTimeout(300);
  const flyPool = await page.evaluate(() => {
    const w = window.__game.scene.getScene("GameScene").world;
    return { flying: w._flying || 0, pool: (w._flyPool || []).length };
  });

  // 원복(다음 테스트 영향 방지)
  await page.evaluate(() => localStorage.removeItem("gp-a11y-v1"));

  const result = { before, after, cls, stored, settingsBtn, persisted, flyPool, errors };
  console.log(JSON.stringify(result, null, 1));
  const fail = [];
  if (!cls.includes("gp-bigtext") || !cls.includes("gp-reduce-motion")) fail.push("html class not applied");
  if (!(after.tab > before.tab && after.cardSub > before.cardSub)) fail.push("big text did not enlarge");
  if (before.tabRect[1] < 44 || before.qty[1] < 44 || settingsBtn[1] < 44) fail.push("touch target < 44px");
  if (!persisted.includes("gp-bigtext") || !persisted.includes("gp-reduce-motion")) fail.push("a11y prefs not persisted across reload");
  if (flyPool.flying !== 0 || flyPool.pool !== 0) fail.push("fly ballots ran under reduce-motion");
  if (errors.length) fail.push(`console errors: ${errors.join(" | ")}`);
  if (fail.length) throw new Error(fail.join(" | "));
} finally {
  await browser.close();
}
