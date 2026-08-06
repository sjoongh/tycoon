import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const durationMs = Number(process.env.PLAY_DURATION_MS) || 180000;
const tapDelayMs = Math.max(80, Number(process.env.PLAY_TAP_DELAY_MS) || 105);
const requestedFamily = process.env.OPERATION_FAMILY || "adaptive";
if (!["adaptive", "tap", "build", "response"].includes(requestedFamily)) {
  throw new Error(`Unknown OPERATION_FAMILY: ${requestedFamily}`);
}
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run hands-on play against non-local host: ${parsedUrl.hostname}`);
}

const evidenceDir = process.env.PLAY_EVIDENCE_DIR || ".qa-test-automations/evidence/2026-08-05/screenshots";
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
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(500);
await page.route("**/*", async (route) => {
  const hostname = new URL(route.request().url()).hostname;
  if (["localhost", "127.0.0.1"].includes(hostname)) await route.continue();
  else await route.abort("blockedbyclient");
});
const errors = [];
page.on("pageerror", (error) => errors.push(`PAGEERR ${error.message}`));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const text = message.text();
  const expectedExternalBlock = text.includes("ERR_BLOCKED_BY_CLIENT")
    || (text.includes("Failed to fetch") && text.includes("firebase_analytics.js"));
  if (!text.includes("navigator.vibrate") && !expectedExternalBlock) errors.push(`CONSOLE ${text}`);
});
page.on("requestfailed", (request) => {
  const requestUrl = new URL(request.url());
  if (["localhost", "127.0.0.1"].includes(requestUrl.hostname)) {
    errors.push(`NETWORK ${request.url()} ${request.failure()?.errorText || "failed"}`);
  }
});

const readState = () => page.evaluate(() => {
  const gameState = window.__game?.registry.get("gameState");
  if (!gameState) return null;
  const data = gameState.data;
  return {
    area: data.stage.area,
    progress: Math.round(data.stage.progress),
    target: data.stage.target,
    votes: Math.round(data.votes),
    cps: Number(gameState.cps().toFixed(1)),
    clicks: data.stats.totalClicks,
    upgrades: data.stats.totalUpgrades,
    events: data.stats.totalEvents,
    operations: gameState.operationCount(),
    operationFamilies: gameState.operationFamilyCounts(),
    feverFamily: gameState.feverFamily(),
    feverActive: gameState.feverActive(),
    feverRecovering: gameState.feverRecovering(),
    feverCharge: Math.round(gameState.feverCharge()),
    bossActive: gameState.bossActive?.() || false,
    bossArea: data.boss?.area || 0,
    bossOutcome: data.boss?.outcome || null,
    bossPattern: gameState.bossPatternStatus?.()?.phase?.type || null,
  };
});

const clickIfVisible = async (selector) => {
  const target = page.locator(selector).first();
  if (!(await target.count()) || !(await target.isVisible().catch(() => false))) return false;
  await target.click({ timeout: 500 }).catch(() => {});
  return true;
};

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game?.registry.get("gameState"), null, { timeout: 10000 });
  await page.waitForTimeout(400);

  // 실제 첫 사용자처럼 오프닝 세 장을 읽고 시작한다. GameState 값은 주입하지 않는다.
  for (let index = 0; index < 5; index += 1) {
    if (!(await clickIfVisible(".gp-modal [data-next]"))) break;
    await page.waitForTimeout(100);
  }

  const startedAt = Date.now();
  let taps = 0;
  let operationChoices = 0;
  let feverCycles = 0;
  let recoveryCycles = 0;
  let finisherClicks = 0;
  let bossCycles = 0;
  let bossSuccesses = 0;
  let bossFailures = 0;
  const bossPatternsSeen = new Set();
  let lastActive = false;
  let lastRecovering = false;
  let lastBossActive = false;
  let nextProgressAt = 30000;
  let nextStaffAt = 12000;
  let nextEventAt = 8000;
  let facilityIndex = 0;

  const recordState = (state) => {
    if (!state) return;
    if (state.feverActive && !lastActive) feverCycles += 1;
    if (state.feverRecovering && !lastRecovering) recoveryCycles += 1;
    if (state.bossActive && !lastBossActive) bossCycles += 1;
    if (!state.bossActive && lastBossActive) {
      if (state.bossOutcome === "success") bossSuccesses += 1;
      else if (state.bossOutcome) bossFailures += 1;
    }
    if (state.bossPattern) bossPatternsSeen.add(state.bossPattern);
    lastActive = state.feverActive;
    lastRecovering = state.feverRecovering;
    lastBossActive = state.bossActive;
  };

  while (Date.now() - startedAt < durationMs) {
    const elapsed = Date.now() - startedAt;
    recordState(await readState());

    let operationCard = requestedFamily === "adaptive"
      ? page.locator(".gp-opcard:has(.gp-opcard__meta em)").first()
      : page.locator(`.gp-opcard--${requestedFamily}`).first();
    if (!(await operationCard.count())) operationCard = page.locator(".gp-opcard").first();
    if (await operationCard.count() && await operationCard.isVisible().catch(() => false)) {
      await page.waitForFunction(() => document.querySelector(".gp-modal-ov")?.dataset.ready === "true").catch(() => {});
      await operationCard.click().catch(() => {});
      await clickIfVisible("[data-operation-confirm]");
      operationChoices += 1;
      await page.waitForTimeout(80);
      continue;
    }

    const rapidBoss = page.locator('.gp-boss [data-boss-action="rapid"]');
    const expectedBoss = page.locator(".gp-boss .gp-boss__action--expected");
    const hotTimingBoss = page.locator('.gp-boss__controls--hot [data-boss-action="timing"]');
    if (await rapidBoss.isVisible().catch(() => false)) {
      await rapidBoss.click().catch(() => {});
      await page.waitForTimeout(55);
      continue;
    }
    if (await expectedBoss.isVisible().catch(() => false)) {
      await expectedBoss.click().catch(() => {});
      await page.waitForTimeout(55);
      continue;
    }
    if (await hotTimingBoss.isVisible().catch(() => false)) {
      await hotTimingBoss.click().catch(() => {});
      await page.waitForTimeout(55);
      continue;
    }
    if (await page.locator('.gp-boss [data-boss-action="timing"]').isVisible().catch(() => false)) {
      await page.waitForTimeout(45);
      continue;
    }

    if (await clickIfVisible(".gp-rush--ready")) finisherClicks += 1;
    if (await clickIfVisible('[data-action="advanceStage"]')) {
      await page.waitForTimeout(80);
      continue;
    }

    if (elapsed >= nextEventAt) {
      await clickIfVisible('[data-tab="events"]');
      if (await clickIfVisible('[data-action="getEvent"]')) {
        await page.waitForTimeout(60);
        await clickIfVisible('[data-action="eventChoice"]');
      }
      await clickIfVisible('[data-tab="facilities"]');
      nextEventAt += 12000;
    }

    if (elapsed >= nextStaffAt) {
      await clickIfVisible('[data-tab="crew"]');
      await clickIfVisible('.gp-staff .gp-btn--ready');
      await clickIfVisible('[data-tab="facilities"]');
      nextStaffAt += 15000;
    }

    if (taps % 6 === 0) {
      await clickIfVisible('[data-action="upgradeFac"].gp-btn--ready');
    }
    if (taps > 0 && taps % 90 === 0) {
      const facilities = page.locator(".gp-fac:not(.gp-fac--locked)");
      const count = await facilities.count();
      if (count > 0) {
        facilityIndex = (facilityIndex + 1) % count;
        await facilities.nth(facilityIndex).click().catch(() => {});
      }
    }

    await page.mouse.click(195, 360);
    taps += 1;
    await page.waitForTimeout(tapDelayMs);

    const state = await readState();
    if (state) {
      recordState(state);
      if (elapsed >= nextProgressAt) {
        console.log(JSON.stringify({ kind: "progress", elapsedSec: Math.round(elapsed / 1000), taps, operationChoices, feverCycles, recoveryCycles, finisherClicks, bossCycles, bossSuccesses, bossFailures, state }));
        nextProgressAt += 30000;
      }
    }
  }

  await page.screenshot({ path: `${evidenceDir}/SC-OPF-004-hands-on-${requestedFamily}-${Math.round(durationMs / 1000)}s.png` });
  const state = await readState();
  const result = {
    ok: errors.length === 0,
    pace: `${tapDelayMs <= 140 ? "high-intensity power-user stress" : "casual active"} · ${tapDelayMs}ms tap interval · ${requestedFamily} operation picks`,
    elapsedSec: Math.round((Date.now() - startedAt) / 1000),
    taps,
    operationChoices,
    feverCycles,
    recoveryCycles,
    finisherClicks,
    bossCycles,
    bossSuccesses,
    bossFailures,
    bossPatternsSeen: [...bossPatternsSeen],
    state,
    errors,
  };
  console.log(JSON.stringify({ kind: "final", ...result }, null, 2));
  if (errors.length) throw new Error(errors.join(" | "));
} finally {
  await browser.close();
}
