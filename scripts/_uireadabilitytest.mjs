import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run E2E against non-local host: ${parsedUrl.hostname}`);
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

try {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  for (let index = 0; index < 4; index += 1) {
    const next = page.locator(".gp-modal [data-next]");
    if (await next.count()) await next.click();
    await page.waitForTimeout(70);
  }

  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.data.tutorial = { step: 5, done: true, openingSeen: true };
    gameState.data.votes = 500000;
    gameState.data.explain = 50000;
    gameState.data.stage.area = 3;
    gameState.data.stage.target = gameState.stageTarget(3);
    gameState.data.stage.progress = gameState.data.stage.target;
    gameState.data.operations.draft = null;
    gameState.emit("changed");
  });
  await page.locator('[data-action="advanceStage"]').click();
  await page.waitForTimeout(180);

  const modalCollision = {
    operationModals: await page.locator(".gp-modal--operation").count(),
    announcements: await page.locator(".gp-banner").count(),
    legacyToasts: await page.locator(".gp-toast").count(),
  };
  if (modalCollision.operationModals !== 1 || modalCollision.announcements !== 0 || modalCollision.legacyToasts !== 0) {
    throw new Error(`operation modal announcement collision: ${JSON.stringify(modalCollision)}`);
  }
  await page.screenshot({ path: `${evidenceDir}/SC-UIR-001-step-1-operation-priority.png` });

  await page.locator("[data-operation]").first().click();
  await page.waitForTimeout(120);
  const stageAnnouncement = await page.locator(".gp-banner").textContent();
  if (!stageAnnouncement?.includes("4구역 진입")) {
    throw new Error(`stage announcement did not resume first: ${stageAnnouncement}`);
  }

  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.emit("celebrate", { text: "🎉 QA 보상" });
    gameState.emit("celebrate", { text: "🎉 QA 보상" });
    gameState.emit("comm-warning", { text: "🚩 QA 위기 경고" });
  });
  await page.waitForTimeout(2200);
  const priorityAnnouncement = {
    count: await page.locator(".gp-banner").count(),
    text: await page.locator(".gp-banner").textContent(),
    tone: await page.locator(".gp-banner").getAttribute("class"),
    worldTitleHidden: await page.evaluate(() => {
      const world = window.__game.scene.getScene("GameScene").world;
      return world.titleMain.visible === false && world.titleZone.input?.enabled === false;
    }),
  };
  if (priorityAnnouncement.count !== 1 || !priorityAnnouncement.text?.includes("QA 위기") || !priorityAnnouncement.tone?.includes("gp-banner--danger") || !priorityAnnouncement.worldTitleHidden) {
    throw new Error(`announcement priority mismatch: ${JSON.stringify(priorityAnnouncement)}`);
  }
  await page.screenshot({ path: `${evidenceDir}/SC-UIR-001-step-2-single-announcement.png` });

  let maxCentralAnnouncements = 0;
  for (let index = 0; index < 16; index += 1) {
    maxCentralAnnouncements = Math.max(maxCentralAnnouncements, await page.locator(".gp-banner, .gp-toast").count());
    await page.waitForTimeout(80);
  }
  if (maxCentralAnnouncements > 1) throw new Error(`central announcements overlapped: ${maxCentralAnnouncements}`);

  await page.waitForFunction(() => !document.querySelector(".gp-banner"), null, { timeout: 12000 });
  const worldTitleRestored = await page.evaluate(() => {
    const world = window.__game.scene.getScene("GameScene").world;
    return world.titleMain.visible === true && world.titleZone.input?.enabled === true;
  });
  if (!worldTitleRestored) throw new Error("world title did not return after the central announcement queue drained");

  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.data.paused = true;
    gameState.data.stage.progress = gameState.data.stage.target / 2;
    gameState.data.commGauge = 20;
    gameState.emit("changed");
  });
  await page.waitForTimeout(100);
  const transformState = await page.evaluate(() => ({
    stageProgress: document.querySelector('[data-k="progress"]')?.style.transform,
    commProgress: document.querySelector(".gp-commgauge__fill")?.style.transform,
  }));
  if (transformState.stageProgress !== "scaleX(0.5)" || transformState.commProgress !== "scaleX(0.5)") {
    throw new Error(`progress transforms mismatch: ${JSON.stringify(transformState)}`);
  }

  const readability = await page.evaluate(() => {
    const px = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    const rect = (selector) => {
      const value = document.querySelector(selector).getBoundingClientRect();
      return { width: value.width, height: value.height };
    };
    return {
      chipLabel: px(".gp-chip__label"),
      stage: px(".gp-stage"),
      cardBody: px(".gp-card__sub"),
      settingsTarget: rect(".gp-mute"),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      stageText: document.querySelector('[data-k="stage"]')?.textContent,
    };
  });
  if (readability.chipLabel < 10 || readability.stage < 11 || readability.cardBody < 11) {
    throw new Error(`readability floor mismatch: ${JSON.stringify(readability)}`);
  }
  if (readability.settingsTarget.width < 44 || readability.settingsTarget.height < 44 || readability.overflow) {
    throw new Error(`mobile target or overflow mismatch: ${JSON.stringify(readability)}`);
  }
  if (readability.stageText?.includes("초당")) throw new Error(`duplicate CPS remains in HUD: ${readability.stageText}`);

  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(120);
  const compactState = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    settings: (() => {
      const rect = document.querySelector(".gp-mute").getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    })(),
    chips: [...document.querySelectorAll(".gp-chip")].map((item) => item.getBoundingClientRect().width),
  }));
  if (compactState.overflow || compactState.settings.width < 44 || compactState.settings.height < 44 || compactState.chips.some((width) => width < 48)) {
    throw new Error(`compact viewport mismatch: ${JSON.stringify(compactState)}`);
  }
  await page.screenshot({ path: `${evidenceDir}/SC-UIR-001-step-3-compact-360.png` });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.__game.registry.get("gameState").emit("celebrate", { text: "감속 모드 확인" }));
  await page.waitForTimeout(50);
  const reducedTransitions = await page.evaluate(() => ({
    progress: getComputedStyle(document.querySelector(".gp-progress__fill")).transitionDuration,
    announcement: getComputedStyle(document.querySelector(".gp-banner")).transitionDuration,
  }));
  if (reducedTransitions.progress !== "0s" || reducedTransitions.announcement !== "0s") {
    throw new Error(`reduced motion transition mismatch: ${JSON.stringify(reducedTransitions)}`);
  }

  if (errors.length) throw new Error(errors.join(" | "));
  console.log(JSON.stringify({
    ok: true,
    target: baseUrl,
    modalCollision,
    priorityAnnouncement,
    maxCentralAnnouncements,
    worldTitleRestored,
    transformState,
    readability,
    compactState,
    reducedTransitions,
    screenshots: 3,
  }, null, 2));
} finally {
  await browser.close();
}
