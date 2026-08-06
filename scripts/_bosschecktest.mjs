import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run boss E2E against non-local host: ${parsedUrl.hostname}`);
}

const evidenceDir = ".qa-test-automations/evidence/2026-08-05/screenshots";
await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(5000);
const errors = [];
page.on("pageerror", (error) => errors.push(`PAGEERR ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("navigator.vibrate")) errors.push(`CONSOLE ${message.text()}`);
});
page.on("requestfailed", (request) => {
  const requestUrl = new URL(request.url());
  if (["localhost", "127.0.0.1"].includes(requestUrl.hostname)) {
    errors.push(`NETWORK ${request.url()} ${request.failure()?.errorText || "failed"}`);
  }
});

const prepareArea = (area) => page.evaluate((value) => {
  const gameState = window.__game.registry.get("gameState");
  gameState.data.tutorial = { step: 5, done: true, openingSeen: true };
  gameState.data.operations.draft = null;
  gameState.data.stage.area = value;
  gameState.data.stage.target = gameState.stageTarget(value);
  gameState.data.stage.progress = gameState.data.stage.target;
  gameState.data.boss = { active: false, area: 0, progress: 0, target: 0, startedAt: 0, endsAt: 0, clearedArea: 0, outcome: null };
  gameState.emit("changed");
}, area);

const chooseOperation = async () => {
  const card = page.locator("[data-operation]").first();
  await card.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector(".gp-modal-ov")?.dataset.ready === "true");
  await card.click();
  await page.locator("[data-operation-confirm]").click();
  await page.waitForTimeout(100);
};

try {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("ztest-qa-gaepyo-boss-cleared")) {
      localStorage.clear();
      sessionStorage.setItem("ztest-qa-gaepyo-boss-cleared", "1");
    }
    window.__bossResults = [];
    document.addEventListener("gp:boss-resolved", (event) => {
      const result = event.detail || {};
      window.__bossResults.push({ area: result.area, outcome: result.outcome, success: result.success, bonusVotes: result.bonusVotes });
    });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"));
  await page.waitForTimeout(500);
  for (let index = 0; index < 4; index += 1) {
    const next = page.locator(".gp-modal [data-next]");
    if (await next.count()) await next.click();
    await page.waitForTimeout(70);
  }

  await prepareArea(3);
  const cta = page.locator(".gp-btn--boss");
  if (!await cta.textContent().then((text) => text?.includes("최종 검증"))) throw new Error("checkpoint CTA did not replace normal completion");
  await cta.click();
  await page.locator(".gp-boss--active").waitFor({ state: "visible" });
  const activeState = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    const skip = document.querySelector(".gp-boss__skip").getBoundingClientRect();
    const world = window.__game.scene.getScene("GameScene").world;
    return {
      area: gameState.data.boss.area,
      target: gameState.data.boss.target,
      remaining: gameState.bossRemainingMs(),
      bossCards: document.querySelectorAll(".gp-boss").length,
      operationModals: document.querySelectorAll(".gp-modal--operation").length,
      banners: document.querySelectorAll(".gp-banner").length,
      skip: { width: skip.width, height: skip.height },
      worldTitleHidden: world.titleMain.visible === false && world.titleZone.input?.enabled === false,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  if (activeState.area !== 3 || activeState.target < 40 || activeState.remaining < 7000 || activeState.bossCards !== 1
    || activeState.operationModals !== 0 || activeState.banners !== 0 || activeState.skip.width < 44 || activeState.skip.height < 44
    || !activeState.worldTitleHidden || activeState.overflow) {
    throw new Error(`active boss UI mismatch: ${JSON.stringify(activeState)}`);
  }

  const clicksBefore = await page.evaluate(() => window.__game.registry.get("gameState").data.stats.totalClicks);
  await page.mouse.click(195, 360);
  await page.waitForTimeout(100);
  const tapState = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    return { clicks: gameState.data.stats.totalClicks, progress: gameState.data.boss.progress };
  });
  if (tapState.clicks !== clicksBefore + 1 || tapState.progress <= 0) throw new Error(`boss overlay blocked world tap: ${JSON.stringify(tapState)}`);
  await page.screenshot({ path: `${evidenceDir}/SC-BOSS-001-step-1-active-mobile.png` });

  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.addBossProgress(gameState.data.boss.target);
  });
  await page.locator(".gp-boss--success").waitFor({ state: "visible" });
  await page.waitForTimeout(120);
  const successText = await page.locator(".gp-boss--success").textContent();
  if (!successText?.includes("정밀 검표 성공") || !successText.includes("완료 보상")) throw new Error(`success feedback mismatch: ${successText}`);
  await page.screenshot({ path: `${evidenceDir}/SC-BOSS-001-step-2-success-mobile.png` });
  await page.locator(".gp-modal--operation").waitFor({ state: "visible", timeout: 3000 });
  const successState = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    return {
      area: gameState.data.stage.area,
      draftArea: gameState.data.operations.draft?.area,
      bossCards: document.querySelectorAll(".gp-boss").length,
      results: window.__bossResults,
      bonusLogged: gameState.data.log.some((line) => line.includes("보스 +")),
    };
  });
  if (successState.area !== 4 || successState.draftArea !== 3 || successState.bossCards !== 0
    || successState.results[0]?.outcome !== "success" || successState.results[0]?.bonusVotes <= 0 || !successState.bonusLogged) {
    throw new Error(`success sequence mismatch: ${JSON.stringify(successState)}`);
  }
  await page.locator("[data-operation]").nth(1).click({ force: true });
  await page.waitForTimeout(80);
  const guardedDraft = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    return { picks: gameState.operationCount(), draftArea: gameState.data.operations.draft?.area };
  });
  if (guardedDraft.picks !== 0 || guardedDraft.draftArea !== 3) throw new Error(`operation tap-through guard failed: ${JSON.stringify(guardedDraft)}`);
  await chooseOperation();

  await prepareArea(6);
  await page.locator(".gp-btn--boss").click();
  await page.locator(".gp-boss--active").waitFor({ state: "visible" });
  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.syncBoss(gameState.data.boss.endsAt);
  });
  await page.locator(".gp-boss--base").waitFor({ state: "visible" });
  const failedText = await page.locator(".gp-boss--base").textContent();
  if (!failedText?.includes("시간 종료") || !failedText.includes("페널티 없이")) throw new Error(`failure feedback mismatch: ${failedText}`);
  await page.locator(".gp-modal--operation").waitFor({ state: "visible", timeout: 3000 });
  const failedResult = await page.evaluate(() => window.__bossResults.at(-1));
  if (failedResult?.outcome !== "failed" || failedResult.bonusVotes !== 0) throw new Error(`failure result mismatch: ${JSON.stringify(failedResult)}`);
  await chooseOperation();

  await prepareArea(9);
  await page.locator(".gp-btn--boss").click();
  await page.locator(".gp-boss__skip").click();
  await page.locator(".gp-boss--base").waitFor({ state: "visible" });
  const skippedText = await page.locator(".gp-boss--base").textContent();
  if (!skippedText?.includes("기본 완료 선택")) throw new Error(`skip feedback mismatch: ${skippedText}`);
  await page.locator(".gp-modal--operation").waitFor({ state: "visible", timeout: 3000 });
  const skippedResult = await page.evaluate(() => window.__bossResults.at(-1));
  if (skippedResult?.outcome !== "skipped" || skippedResult.bonusVotes !== 0) throw new Error(`skip result mismatch: ${JSON.stringify(skippedResult)}`);
  await chooseOperation();

  await page.setViewportSize({ width: 1280, height: 900 });
  await prepareArea(12);
  await page.locator(".gp-btn--boss").click();
  await page.locator(".gp-boss--active").waitFor({ state: "visible" });
  const desktopState = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    bossWidth: document.querySelector(".gp-boss").getBoundingClientRect().width,
  }));
  if (desktopState.overflow || desktopState.bossWidth > 370) throw new Error(`desktop boss layout mismatch: ${JSON.stringify(desktopState)}`);
  await page.screenshot({ path: `${evidenceDir}/SC-BOSS-001-step-3-active-desktop.png` });

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotion = await page.evaluate(() => ({
    cardAnimation: getComputedStyle(document.querySelector(".gp-boss")).animationName,
    meterTransition: getComputedStyle(document.querySelector(".gp-boss__meter span")).transitionDuration,
  }));
  if (reducedMotion.cardAnimation !== "none" || reducedMotion.meterTransition !== "0s") {
    throw new Error(`reduced motion mismatch: ${JSON.stringify(reducedMotion)}`);
  }

  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.data.boss.startedAt = Date.now() - 9000;
    gameState.data.boss.endsAt = Date.now() - 1000;
    gameState.save(false);
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"));
  await page.waitForTimeout(500);
  const restored = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    return {
      area: gameState.data.stage.area,
      active: gameState.bossActive(),
      required: gameState.bossRequired(),
      outcome: gameState.data.boss.outcome,
      clearedArea: gameState.data.boss.clearedArea,
      bossCards: document.querySelectorAll(".gp-boss").length,
      completionText: document.querySelector('[data-action="advanceStage"]')?.textContent,
    };
  });
  if (restored.area !== 12 || restored.active || restored.required || restored.outcome !== "failed" || restored.clearedArea !== 12
    || restored.bossCards !== 0 || !restored.completionText?.includes("지역완료")) {
    throw new Error(`expired reload recovery mismatch: ${JSON.stringify(restored)}`);
  }

  if (errors.length) throw new Error(errors.join(" | "));
  console.log(JSON.stringify({
    ok: true,
    target: baseUrl,
    activeState,
    tapState,
    successState,
    guardedDraft,
    failedResult,
    skippedResult,
    desktopState,
    reducedMotion,
    restored,
    screenshots: 3,
  }, null, 2));
} finally {
  await browser.close();
}
