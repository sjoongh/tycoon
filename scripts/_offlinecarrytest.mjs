import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run offline carry E2E against non-local host: ${parsedUrl.hostname}`);
}

const SAVE_KEY = "trust-office-phaser-v2";
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

const todayIndex = (now) => {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 86400000);
};

const baseSeed = (now, overrides = {}) => ({
  version: 5,
  votes: 1000,
  explain: 500,
  trust: 78,
  days: 18,
  paused: false,
  selected: "desk",
  activeTab: "facilities",
  tutorial: { step: 5, done: true, openingSeen: true },
  lastSavedAt: now,
  lastSeenAt: now,
  facilities: { desk: 1, sorter: 0, notice: 0, server: 0, archive: 0, studio: 0 },
  staff: { clerk: 0, auditor: 0, runner: 0, engineer: 0, analyst: 0, speaker: 0 },
  stage: { area: 2, progress: 2762, target: 2862, completed: 1 },
  prestige: { seals: 0, runs: 0, bestArea: 2, totalSeals: 0, upgrades: {}, medals: 0, totalMedals: 0, medalBest: 4, medalUpgrades: {} },
  stats: { totalVotes: 1000, totalClicks: 0, totalUpgrades: 0, totalEvents: 0, totalOfflineMs: 0, totalItems: 0 },
  daily: { day: todayIndex(now), streak: 1, qday: todayIndex(now), clicks: 0, events: 0, upgrades: 0, items: 0, newdex: 0, claimed: {} },
  weekly: { week: Math.floor(todayIndex(now) / 7), baseVotes: 0, target: 1e12, claimed: true },
  eventReadyAt: now + 9e8,
  offline2xDay: 0,
  log: ["ztest-qa-gaepyo-offline-carry"],
  ...overrides,
});

const makePage = async (seed, viewport = { width: 390, height: 844 }) => {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
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
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem("ztest-qa-gaepyo-seeded")) {
      localStorage.setItem(key, JSON.stringify(value));
      sessionStorage.setItem("ztest-qa-gaepyo-seeded", "1");
    }
    localStorage.setItem("gp-notif-asked", "1");
  }, { key: SAVE_KEY, value: seed });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry?.get("gameState"));
  await page.waitForTimeout(450);
  return { context, page, errors };
};

const assertNoOverflow = async (page, label) => {
  const state = await page.evaluate(() => ({
    documentOverflow: document.documentElement.scrollWidth > window.innerWidth,
    gameOverflow: (() => {
      const game = document.querySelector("#game");
      return game ? game.scrollWidth > game.clientWidth + 1 : false;
    })(),
  }));
  if (state.documentOverflow || state.gameOverflow) throw new Error(`${label} overflow: ${JSON.stringify(state)}`);
  return state;
};

const results = {};

try {
  const now = Date.now();
  const offlineSeed = baseSeed(now, { lastSavedAt: now - 8 * 3600000, lastSeenAt: now - 8 * 3600000 });
  const first = await makePage(offlineSeed);
  const { page } = first;

  await page.locator(".gp-modal-ov .gp-mtitle", { hasText: "오프라인 정산" }).waitFor({ state: "visible" });
  const modalText = await page.locator(".gp-modal-ov").textContent();
  if (!modalText?.includes("현재 구역 반영") || !modalText.includes("다음 지역 이월") || !modalText.includes("보스·작전 앞에서 멈춥니다")) {
    throw new Error(`offline allocation copy missing: ${modalText}`);
  }
  results.initial = await page.evaluate(() => {
    const gs = window.__game.registry.get("gameState");
    return {
      version: gs.data.version,
      area: gs.data.stage.area,
      progress: Math.round(gs.data.stage.progress),
      target: Math.round(gs.data.stage.target),
      rewardVotes: Math.round(gs.offlineReward?.votes || 0),
      progressApplied: Math.round(gs.offlineReward?.progressApplied || 0),
      carryAdded: Math.round(gs.offlineReward?.carryAdded || 0),
      carry: Math.round(gs.data.offlineCarryVotes || 0),
    };
  });
  if (results.initial.version !== 6 || results.initial.progress !== results.initial.target
    || results.initial.progressApplied !== 100 || results.initial.carryAdded <= 0
    || results.initial.carry !== results.initial.carryAdded) {
    throw new Error(`initial offline allocation mismatch: ${JSON.stringify(results.initial)}`);
  }
  const claimButtons = await page.locator(".gp-modal-ov .gp-confirm-row .gp-btn").evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent.trim(), h: node.getBoundingClientRect().height })));
  if (claimButtons.length !== 2 || claimButtons.some((button) => button.h < 44)) throw new Error(`offline CTA size mismatch: ${JSON.stringify(claimButtons)}`);
  await assertNoOverflow(page, "mobile offline modal");
  await page.screenshot({ path: `${evidenceDir}/SC-OFFLINE-001-step-1-allocation-mobile.png` });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry?.get("gameState"));
  await page.waitForTimeout(350);
  results.rapidReload = await page.evaluate((before) => {
    const gs = window.__game.registry.get("gameState");
    return {
      offlineReward: gs.offlineReward,
      votes: Math.round(gs.data.votes),
      carry: Math.round(gs.data.offlineCarryVotes),
      area: gs.data.stage.area,
      modalTitles: Array.from(document.querySelectorAll(".gp-mtitle")).map((node) => node.textContent.trim()),
      matchesCheckpoint: Math.round(gs.data.votes) === before.votes && Math.round(gs.data.offlineCarryVotes) === before.carry,
    };
  }, { votes: Math.round(1000 + results.initial.rewardVotes), carry: results.initial.carry });
  if (results.rapidReload.offlineReward || !results.rapidReload.matchesCheckpoint
    || results.rapidReload.area !== 2 || results.rapidReload.modalTitles.includes("오프라인 정산")) {
    throw new Error(`rapid reload duplicate guard mismatch: ${JSON.stringify(results.rapidReload)}`);
  }

  await page.locator(".gp-carry").waitFor({ state: "visible" });
  const carryBeforeStage = await page.evaluate(() => window.__game.registry.get("gameState").data.offlineCarryVotes);
  await page.locator('[data-action="advanceStage"]').click();
  await page.waitForFunction(() => window.__game.registry.get("gameState").data.stage.area === 3);
  results.checkpoint = await page.evaluate(() => {
    const gs = window.__game.registry.get("gameState");
    return {
      area: gs.data.stage.area,
      progress: Math.round(gs.data.stage.progress),
      target: Math.round(gs.data.stage.target),
      carry: Math.round(gs.data.offlineCarryVotes),
      bossRequired: gs.bossRequired(),
      operationDraft: gs.data.operations.draft,
    };
  });
  if (results.checkpoint.progress !== results.checkpoint.target || !results.checkpoint.bossRequired
    || results.checkpoint.carry >= carryBeforeStage || results.checkpoint.operationDraft) {
    throw new Error(`checkpoint carry gate mismatch: ${JSON.stringify(results.checkpoint)}`);
  }

  await page.locator(".gp-btn--boss").click();
  await page.locator(".gp-boss--active").waitFor({ state: "visible" });
  const carryDuringBoss = await page.evaluate(() => window.__game.registry.get("gameState").data.offlineCarryVotes);
  if (Math.round(carryDuringBoss) !== results.checkpoint.carry) throw new Error("carry changed while boss was unresolved");
  await page.locator(".gp-boss__skip").click();
  await page.locator(".gp-modal--operation").waitFor({ state: "visible", timeout: 4000 });
  results.operationGate = await page.evaluate(() => {
    const gs = window.__game.registry.get("gameState");
    return {
      area: gs.data.stage.area,
      progress: Math.round(gs.data.stage.progress),
      target: Math.round(gs.data.stage.target),
      carry: Math.round(gs.data.offlineCarryVotes),
      draftArea: gs.data.operations.draft?.area,
      operationCount: gs.operationCount(),
    };
  });
  if (results.operationGate.area !== 4 || results.operationGate.progress !== results.operationGate.target
    || results.operationGate.draftArea !== 3 || results.operationGate.operationCount !== 0
    || results.operationGate.carry >= results.checkpoint.carry) {
    throw new Error(`operation carry gate mismatch: ${JSON.stringify(results.operationGate)}`);
  }
  await page.screenshot({ path: `${evidenceDir}/SC-OFFLINE-001-step-2-operation-gate-mobile.png` });
  await page.waitForFunction(() => document.querySelector(".gp-modal-ov")?.dataset.ready === "true");
  await page.locator("[data-operation]").first().click();
  await page.locator("[data-operation-confirm]").click();
  await page.waitForTimeout(100);
  if (first.errors.length) throw new Error(first.errors.join(" | "));
  await first.context.close();

  const second = await makePage(offlineSeed);
  const bonusBefore = await second.page.evaluate(() => {
    const gs = window.__game.registry.get("gameState");
    return { votes: gs.data.votes, totalVotes: gs.data.stats.totalVotes, carry: gs.data.offlineCarryVotes, rewardVotes: gs.offlineReward.votes };
  });
  await second.page.locator(".gp-modal-ov [data-confirm]").click();
  results.double = await second.page.evaluate((before) => {
    const gs = window.__game.registry.get("gameState");
    return {
      votesDelta: Math.round(gs.data.votes - before.votes),
      totalDelta: Math.round(gs.data.stats.totalVotes - before.totalVotes),
      carryDelta: Math.round(gs.data.offlineCarryVotes - before.carry),
      expected: Math.round(before.rewardVotes),
      available: gs.offline2xAvailable(),
    };
  }, bonusBefore);
  if (results.double.votesDelta !== results.double.expected || results.double.totalDelta !== results.double.expected
    || results.double.carryDelta !== results.double.expected || results.double.available) {
    throw new Error(`offline double mismatch: ${JSON.stringify(results.double)}`);
  }
  if (second.errors.length) throw new Error(second.errors.join(" | "));
  await second.context.close();

  const prestigeSeed = baseSeed(now, {
    activeTab: "prestige",
    lastSavedAt: now,
    lastSeenAt: now,
    stage: { area: 8, progress: 1000, target: 19393, completed: 7 },
    facilities: { desk: 16, sorter: 9, notice: 6, server: 5, archive: 4, studio: 2 },
    staff: { clerk: 3, auditor: 2, runner: 1, engineer: 1, analyst: 1, speaker: 1 },
    prestige: { seals: 30, runs: 2, bestArea: 8, totalSeals: 60, upgrades: { procedure: 3 }, medals: 2, totalMedals: 4, medalBest: 6, medalUpgrades: {} },
  });
  const third = await makePage(prestigeSeed);
  await third.page.locator(".gp-prestige-advice").waitFor({ state: "visible" });
  results.prestige = await third.page.evaluate(() => {
    const gs = window.__game.registry.get("gameState");
    const advice = document.querySelector(".gp-prestige-advice");
    return {
      gainPct: +gs.prestigeProjection().gainPct.toFixed(1),
      advice: gs.prestigeProjection().advice.key,
      text: advice?.textContent.replace(/\s+/g, " ").trim(),
      width: advice?.getBoundingClientRect().width,
    };
  });
  if (results.prestige.gainPct <= 0 || !results.prestige.text?.includes("영구 생산 +")
    || !["wait", "ready", "strong"].includes(results.prestige.advice) || results.prestige.width > 390) {
    throw new Error(`prestige guidance mismatch: ${JSON.stringify(results.prestige)}`);
  }
  await third.page.screenshot({ path: `${evidenceDir}/SC-PRESTIGE-001-step-1-guidance-panel-mobile.png` });
  await third.page.locator('[data-action="prestigeReset"]').click();
  const prestigeModal = third.page.locator(".gp-modal-ov");
  await prestigeModal.waitFor({ state: "visible" });
  const confirmText = await prestigeModal.textContent();
  if (!confirmText?.includes("현재보다 +") || !confirmText.includes("영구 x")) throw new Error(`prestige confirmation guidance missing: ${confirmText}`);
  await assertNoOverflow(third.page, "mobile prestige modal");
  await third.page.waitForTimeout(250); // 픽셀 fade-in이 끝난 실제 사용 화면을 증적으로 캡처
  await third.page.screenshot({ path: `${evidenceDir}/SC-PRESTIGE-001-step-2-guidance-confirm-mobile.png` });
  await third.page.setViewportSize({ width: 1280, height: 900 });
  await assertNoOverflow(third.page, "desktop prestige modal");
  await third.page.screenshot({ path: `${evidenceDir}/SC-PRESTIGE-001-step-3-guidance-confirm-desktop.png` });
  if (third.errors.length) throw new Error(third.errors.join(" | "));
  await third.context.close();

  console.log(JSON.stringify({ ok: true, target: baseUrl, ...results, screenshots: 5 }, null, 2));
} finally {
  await browser.close();
}
