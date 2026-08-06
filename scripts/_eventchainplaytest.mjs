import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run event-chain E2E against non-local host: ${parsedUrl.hostname}`);
}

const evidenceDir = ".qa-test-automations/evidence/2026-08-06/screenshots";
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
page.setDefaultTimeout(6000);
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

const closeStartupModals = async () => {
  for (let index = 0; index < 5; index += 1) {
    const next = page.locator(".gp-modal [data-next]");
    if (await next.count()) await next.click();
    else {
      const close = page.locator(".gp-modal [data-close]");
      if (await close.count()) await close.first().click();
      else {
        const confirm = page.locator(".gp-modal [data-confirm]");
        if (await confirm.count()) await confirm.first().click();
      }
    }
    await page.waitForTimeout(70);
  }
};

const readyNextEvent = () => page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  gameState.data.eventReadyAt = 0;
  gameState.emit("changed");
});

try {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("ztest-qa-gaepyo-event-chain-cleared")) {
      localStorage.clear();
      sessionStorage.setItem("ztest-qa-gaepyo-event-chain-cleared", "1");
    }
    window.__eventChainResults = [];
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"));
  await page.waitForTimeout(450);
  await closeStartupModals();

  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.data.tutorial = { step: 5, done: true, openingSeen: true };
    gameState.data.activeTab = "events";
    gameState.data.stage.area = 4;
    gameState.data.stage.target = gameState.stageTarget(4);
    gameState.data.stage.progress = 0;
    gameState.data.votes = 100000;
    gameState.data.explain = 10000;
    gameState.data.eventReadyAt = 0;
    gameState.data.eventChain = {
      activeId: "ghost-log",
      step: 0,
      choices: [],
      completed: {},
      effects: [],
      pity: 0,
    };
    gameState.on("event-chain-ending", (result) => window.__eventChainResults.push(result));
    gameState.emit("changed");
  });

  await page.locator('[data-action="getEvent"]').click();
  await page.locator(".gp-event--chain").waitFor({ state: "visible" });
  const firstCard = await page.evaluate(() => {
    const card = document.querySelector(".gp-event--chain");
    const choices = [...document.querySelectorAll('[data-action="eventChoice"]')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, text: button.textContent };
    });
    return {
      badge: card.querySelector(".gp-event__chainbadge")?.textContent,
      title: card.querySelector(".gp-event__title")?.textContent,
      choices,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  if (!firstCard.badge?.includes("1/3") || !firstCard.badge.includes("서버실의 유령 로그") || firstCard.choices.length !== 2
    || firstCard.choices.some((choice) => choice.width < 44 || choice.height < 44) || firstCard.overflow) {
    throw new Error(`first chain card mismatch: ${JSON.stringify(firstCard)}`);
  }
  await page.screenshot({ path: `${evidenceDir}/SC-EVC-001-step-1-chain-mobile.png` });
  await page.locator('[data-action="eventChoice"][data-side="left"]').click();

  await readyNextEvent();
  await page.waitForFunction(() => document.querySelector(".gp-chainline--active")?.textContent.includes("2/3"));
  const followupLabel = await page.locator('[data-action="getEvent"]').textContent();
  if (!followupLabel?.includes("후속 사건 2/3")) throw new Error(`follow-up CTA missing: ${followupLabel}`);
  await page.locator('[data-action="getEvent"]').click();
  await page.locator(".gp-event--chain").waitFor({ state: "visible" });
  await page.locator('[data-action="eventChoice"][data-side="right"]').click();

  await page.evaluate(() => window.__game.registry.get("gameState").save(false));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"));
  await page.waitForTimeout(350);
  await closeStartupModals();
  const restored = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    window.__eventChainResults = [];
    gameState.on("event-chain-ending", (result) => window.__eventChainResults.push(result));
    gameState.data.activeTab = "events";
    gameState.data.eventReadyAt = 0;
    gameState.emit("changed");
    return { activeId: gameState.data.eventChain.activeId, step: gameState.data.eventChain.step, choices: gameState.data.eventChain.choices };
  });
  if (restored.activeId !== "ghost-log" || restored.step !== 2 || restored.choices.join(",") !== "left,right") {
    throw new Error(`chain save restore mismatch: ${JSON.stringify(restored)}`);
  }

  await page.locator('[data-action="getEvent"]').click();
  await page.locator(".gp-event__chainbadge").waitFor({ state: "visible" });
  if (!await page.locator(".gp-event__chainbadge").textContent().then((text) => text?.includes("3/3"))) {
    throw new Error("final chain step badge missing");
  }
  await page.locator('[data-action="eventChoice"][data-side="left"]').click();
  await page.locator(".gp-ending").waitFor({ state: "visible" });
  const endingCard = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    const modal = document.querySelector(".gp-modal");
    const button = modal.querySelector("[data-close]").getBoundingClientRect();
    return {
      title: modal.querySelector(".gp-mtitle")?.textContent,
      discovery: modal.querySelector(".gp-ending__discovery")?.textContent,
      effect: modal.querySelector(".gp-ending__effect")?.textContent,
      reward: modal.querySelector(".gp-ending__reward")?.textContent,
      button: { width: button.width, height: button.height },
      discovered: gameState.eventEndingCount(),
      activeEffects: gameState.data.eventChain.effects,
      completed: gameState.data.eventChain.completed,
      results: window.__eventChainResults.length,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  if (endingCard.title !== "유령 로그 길들이기" || !endingCard.discovery?.includes("새 결말 발견 · 1/9")
    || !endingCard.effect?.includes("초당 생산 +6%") || !endingCard.effect.includes("사건 보상 +12%")
    || !endingCard.reward?.includes("즉시 보상") || endingCard.button.width < 44 || endingCard.button.height < 44
    || endingCard.discovered !== 1 || endingCard.activeEffects[0] !== "ghost-log-tamed"
    || endingCard.completed["ghost-log"] !== 1 || endingCard.results !== 1 || endingCard.overflow) {
    throw new Error(`ending card mismatch: ${JSON.stringify(endingCard)}`);
  }
  await page.waitForTimeout(260);
  await page.screenshot({ path: `${evidenceDir}/SC-EVC-002-step-4-ending-mobile.png` });
  await page.locator(".gp-ending + [data-close]").click();
  await page.waitForTimeout(180);

  const runStatus = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    return {
      line: document.querySelector(".gp-chainline")?.textContent,
      effect: document.querySelector(".gp-chainfx")?.textContent,
      cpsPct: gameState.eventChainEffectFor(gameState.data, "cpsPct"),
      eventPct: gameState.eventChainEffectFor(gameState.data, "eventPct"),
      active: gameState.eventChainStatus().active,
    };
  });
  if (!runStatus.line?.includes("사건 결말 1/9") || !runStatus.effect?.includes("유령 로그 길들이기")
    || runStatus.cpsPct !== 0.06 || runStatus.eventPct !== 0.12 || runStatus.active) {
    throw new Error(`run status mismatch: ${JSON.stringify(runStatus)}`);
  }
  await page.screenshot({ path: `${evidenceDir}/SC-EVC-003-step-5-run-effect-mobile.png` });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"));
  await page.waitForTimeout(300);
  await closeStartupModals();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.data.activeTab = "events";
    gameState.emit("changed");
  });
  await page.waitForTimeout(180);
  const desktop = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    const ui = document.querySelector(".gp-ui").getBoundingClientRect();
    const panel = document.querySelector(".gp-bottom").getBoundingClientRect();
    return {
      discovered: gameState.eventEndingCount(),
      effectId: gameState.data.eventChain.effects[0],
      uiWidth: ui.width,
      panel: { top: panel.top, bottom: panel.bottom, height: panel.height },
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      line: document.querySelector(".gp-chainline")?.textContent,
    };
  });
  if (desktop.discovered !== 1 || desktop.effectId !== "ghost-log-tamed" || desktop.uiWidth > 390
    || desktop.overflow || !desktop.line?.includes("사건 결말 1/9")) {
    throw new Error(`desktop/reload mismatch: ${JSON.stringify(desktop)}`);
  }
  await page.screenshot({ path: `${evidenceDir}/SC-EVC-003-step-6-persist-desktop.png` });

  if (errors.length) throw new Error(errors.join(" | "));
  console.log(JSON.stringify({
    ok: true,
    target: baseUrl,
    mobile: { firstCard, restored, endingCard, runStatus },
    desktop,
    screenshots: 4,
  }, null, 2));
} finally {
  await browser.close();
}
