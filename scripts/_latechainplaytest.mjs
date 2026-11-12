import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run late event-chain E2E against non-local host: ${parsedUrl.hostname}`);
}

const evidenceDir = ".qa-test-automations/evidence/2026-11-12/screenshots";
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
    if (!sessionStorage.getItem("ztest-qa-gaepyo-late-chain-cleared")) {
      localStorage.clear();
      sessionStorage.setItem("ztest-qa-gaepyo-late-chain-cleared", "1");
    }
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"));
  await page.waitForTimeout(450);
  await closeStartupModals();

  // 10구역, 초반 체인 3종 완료 상태 — pity 로 체인 시작을 보장하고 후보가 후반 체인뿐인지 본다
  const candidates = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.data.tutorial = { step: 5, done: true, openingSeen: true };
    gameState.data.activeTab = "events";
    gameState.data.stage.area = 10;
    gameState.data.stage.target = gameState.stageTarget(10);
    gameState.data.stage.progress = 0;
    gameState.data.votes = 1e9;
    gameState.data.explain = 1e6;
    gameState.data.eventReadyAt = 0;
    gameState.data.eventChain = { activeId: null, step: 0, choices: [], completed: { "thirteenth-box": 1, "anonymous-whistle": 1, "ghost-log": 1 }, effects: [], pity: 2 };
    gameState.emit("changed");
    return gameState.availableEventChains().map((chain) => chain.id);
  });
  if (candidates.join(",") !== "exit-poll,ai-counter,blackout") throw new Error(`candidates mismatch: ${candidates}`);
  await page.waitForTimeout(300);
  await closeStartupModals();

  const seen = [];
  for (const [index, side] of ["left", "left", "right"].entries()) {
    await readyNextEvent();
    await page.locator('[data-action="getEvent"]:visible').first().click();
    await page.locator(".gp-event--chain").waitFor({ state: "visible" });
    const card = await page.evaluate(() => {
      const card = document.querySelector(".gp-event--chain");
      const choices = [...document.querySelectorAll('[data-action="eventChoice"]')].map((button) => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height, bottom: rect.bottom };
      });
      return {
        badge: card.querySelector(".gp-event__chainbadge")?.textContent,
        title: card.querySelector(".gp-event__title")?.textContent,
        choices,
        viewport: window.innerHeight,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    if (!card.badge?.includes(`${index + 1}/3`) || card.choices.length !== 2 || card.overflow
      || card.choices.some((choice) => choice.width < 44 || choice.height < 44 || choice.bottom > card.viewport)) {
      throw new Error(`chain card ${index + 1} mismatch: ${JSON.stringify(card)}`);
    }
    seen.push(card);
    await page.screenshot({ path: `${evidenceDir}/SC-LATE-00${index + 1}-step-${index + 1}-mobile.png` });
    await page.locator(`[data-action="eventChoice"][data-side="${side}"]`).click();
  }

  await page.locator(".gp-ending").waitFor({ state: "visible" });
  const ending = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    const modal = document.querySelector(".gp-modal");
    return {
      chain: Object.keys(gameState.data.eventChain.completed).find((id) => !["thirteenth-box", "anonymous-whistle", "ghost-log"].includes(id)),
      title: modal.querySelector(".gp-mtitle")?.textContent,
      discovery: modal.querySelector(".gp-ending__discovery")?.textContent,
      effect: modal.querySelector(".gp-ending__effect")?.textContent,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  if (!ending.chain || !ending.discovery?.includes("1/18") || !ending.effect || ending.overflow) {
    throw new Error(`ending mismatch: ${JSON.stringify(ending)}`);
  }
  await page.waitForTimeout(260);
  await page.screenshot({ path: `${evidenceDir}/SC-LATE-004-ending-mobile.png` });
  await page.locator(".gp-ending + [data-close]").click();
  await page.waitForTimeout(180);

  await page.evaluate(() => document.dispatchEvent(new CustomEvent("gp:open-map")));
  await page.locator(".gp-map").waitFor({ state: "visible" });
  const codex = await page.evaluate(() => {
    const groups = [...document.querySelectorAll(".gp-dexgrp")].map((group) => ({
      title: group.querySelector(".gp-dexgrp__hd b")?.textContent,
      count: group.querySelector(".gp-dexgrp__hd span")?.textContent,
    }));
    const cell = document.querySelector("[data-endid]");
    cell?.scrollIntoView({ block: "center" });
    return { groups, real: cell?.textContent, overflow: document.documentElement.scrollWidth > window.innerWidth };
  });
  const late = codex.groups.filter((group) => ["출구조사의 역습", "AI 개표 보조관", "개표 중 전국 정전"].includes(group.title));
  if (late.length !== 3 || late.filter((group) => group.count === "1/3").length !== 1 || !codex.real || codex.overflow) {
    throw new Error(`codex mismatch: ${JSON.stringify(codex)}`);
  }
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${evidenceDir}/SC-LATE-005-codex-mobile.png` });

  if (errors.length) throw new Error(errors.join(" | "));
  console.log(JSON.stringify({ ok: true, target: baseUrl, candidates, cards: seen.map((card) => card.badge), ending, late }, null, 2));
} finally {
  await browser.close();
}
