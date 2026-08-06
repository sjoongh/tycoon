// 결정적 성장 시뮬레이션: 보통 속도 능동 플레이(초당 3탭, 45초마다 사건 대응,
// 5초마다 생산 효율이 높은 시설/직원을 구매)로 첫 3회의 감사 도달 시간을 측정한다.
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const calibrationBase = Number(process.env.BALANCE_TARGET_BASE) || null;
const calibrationRepeatBase = Number(process.env.BALANCE_REPEAT_BASE) || calibrationBase;
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run balance simulation against non-local host: ${parsedUrl.hostname}`);
}

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
await page.route("**/*", async (route) => {
  const hostname = new URL(route.request().url()).hostname;
  if (["localhost", "127.0.0.1"].includes(hostname)) await route.continue();
  else await route.abort("blockedbyclient");
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("firebase_analytics")) errors.push(`CONSOLE ${message.text()}`);
});
await page.addInitScript(() => localStorage.clear());
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.__game?.registry.get("gameState"));

const result = await page.evaluate(async ({ calibrationBase, calibrationRepeatBase }) => {
  const gameState = window.__game.registry.get("gameState");
  const [{ facilities }, { staffDefinitions }] = await Promise.all([
    import("/src/data/facilities.js"),
    import("/src/data/staff.js"),
  ]);
  gameState.data.tutorial = { step: 5, done: true, openingSeen: true };
  gameState.data.paused = true;
  if (calibrationBase) {
    gameState.stageTarget = (area) => Math.floor(
      (gameState.data?.prestige?.runs > 0 ? calibrationRepeatBase : calibrationBase) * area ** 1.38,
    );
    gameState.data.stage.target = gameState.stageTarget(gameState.data.stage.area);
    gameState.data.stage.progress = 0;
  }

  // 같은 코드/수치에서 항상 같은 사건 순서가 나오도록 고정한다.
  let seed = 0x6a09e667;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const tapsPerSecond = 3;
  const comboAverage = 1.55; // 3탭/초를 유지하되 UI 이동·구매로 콤보가 끊기는 보수적 평균
  const runResults = [];

  const resolveRoutineEvent = () => {
    const event = gameState.pickNextEvent(random);
    if (!event) return;
    const score = (effect) => {
      const value = effect || {};
      return (value.votes || 0) + (value.explain || 0) * 18 + (value.trust || 0) * 55;
    };
    const side = score(event.left?.[1]) >= score(event.right?.[1]) ? "left" : "right";
    gameState.resolveEventChoice(event, side, { fever: false });
  };

  const buyBestAvailable = () => {
    for (let purchase = 0; purchase < 8; purchase += 1) {
      const currentCps = gameState.cpsFor(gameState.data);
      const candidates = [];
      for (const facility of facilities) {
        const plan = gameState.facilityBulkPlan(facility.id, 1);
        if (plan.levels < 1 || plan.voteCost > gameState.data.votes * 0.72 || plan.explainCost > gameState.data.explain * 0.72) continue;
        const next = structuredClone(gameState.data);
        next.facilities[facility.id] += 1;
        const gain = Math.max(0.001, gameState.cpsFor(next) - currentCps);
        candidates.push({ kind: "facility", id: facility.id, score: gain / (plan.voteCost + plan.explainCost * 12) });
      }
      for (const staff of staffDefinitions) {
        const plan = gameState.staffBulkPlan(staff.id, 1);
        if (plan.levels < 1 || plan.voteCost > gameState.data.votes * 0.72 || plan.explainCost > gameState.data.explain * 0.72) continue;
        const next = structuredClone(gameState.data);
        next.staff[staff.id] += 1;
        const gain = Math.max(0.001, gameState.cpsFor(next) - currentCps);
        candidates.push({ kind: "staff", id: staff.id, score: gain / (plan.voteCost + plan.explainCost * 12) });
      }
      candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
      const best = candidates[0];
      if (!best) break;
      if (best.kind === "facility") gameState.bulkUpgrade(best.id, 1);
      else gameState.bulkHire(best.id, 1);
    }
  };

  const clearReadyStage = () => {
    if (gameState.data.stage.progress < gameState.data.stage.target) return false;
    if (gameState.bossRequired()) {
      gameState.startBoss();
      gameState.skipBoss();
    }
    if (!gameState.advanceStage()) return false;
    if (gameState.data.operations?.draft) gameState.chooseOperation(gameState.data.operations.draft.choices[0]);
    return true;
  };

  const spendPermanentCurrency = () => {
    const priorities = ["procedure", "manual", "briefing", "procedure", "manual", "procedure"];
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of priorities) {
        if (gameState.buyPrestigeUpgrade(id)) {
          changed = true;
          break;
        }
      }
    }
  };

  const playUntilArea = (targetArea, startSeconds = 0, maxSeconds = 3600) => {
    const reached = {};
    let seconds = startSeconds;
    while (seconds < maxSeconds && gameState.data.stage.area < targetArea) {
      seconds += 1;
      const passive = gameState.cpsFor(gameState.data);
      const active = gameState.clickPower() * tapsPerSecond * comboAverage;
      gameState.addVotes(passive + active);
      gameState.data.explain += gameState.explainPerSecondFor(gameState.data);
      gameState.data.stats.totalClicks += tapsPerSecond;
      gameState.data.trust = Math.max(0, Math.min(100,
        gameState.data.trust - gameState.trustDecay() + gameState.level("notice") * 0.035 * (1 - gameState.data.trust / 100),
      ));
      if (seconds % 5 === 0) buyBestAvailable();
      if (seconds % 45 === 0) resolveRoutineEvent();
      if (clearReadyStage()) reached[gameState.data.stage.area] = seconds;
    }
    return { seconds, reached };
  };

  let deepRun = null;

  for (let run = 1; run <= 3; run += 1) {
    const { seconds, reached } = playUntilArea(4);

    runResults.push({
      run,
      seconds,
      reached,
      sealsPreview: gameState.prestigePreview(),
      facilityTotal: gameState.facilityTotal(),
      staffTotal: Object.values(gameState.data.staff).reduce((sum, level) => sum + level, 0),
      cps: Math.round(gameState.cpsFor(gameState.data) * 10) / 10,
    });
    if (run === 1 && gameState.data.stage.area >= 4) {
      const prestigeSnapshot = structuredClone(gameState.data);
      const seedAtPrestige = seed;
      const deep = playUntilArea(11, seconds, 3600);
      deepRun = {
        totalSeconds: deep.seconds,
        reached: deep.reached,
        area: gameState.data.stage.area,
        cps: Math.round(gameState.cpsFor(gameState.data) * 10) / 10,
      };
      gameState.data = prestigeSnapshot;
      seed = seedAtPrestige;
    }
    if (gameState.data.stage.area < 4 || !gameState.prestigeReset()) break;
    if (calibrationBase) gameState.data.stage.target = gameState.stageTarget(gameState.data.stage.area);
    spendPermanentCurrency();
  }

  return {
    calibrationBase,
    calibrationRepeatBase,
    target: { first: [480, 720], repeat: [300, 480] },
    model: { tapsPerSecond, comboAverage, eventCadenceSeconds: 45, purchaseCadenceSeconds: 5 },
    runResults,
    deepRun,
  };
}, { calibrationBase, calibrationRepeatBase });
await browser.close();

const failures = [];
if (errors.length) failures.push(`browser errors: ${errors.join(" | ")}`);
if (result.runResults.length !== 3) failures.push(`expected 3 runs, received ${result.runResults.length}`);
if (!result.deepRun || result.deepRun.area < 11 || result.deepRun.totalSeconds > 3600) {
  failures.push(`deep run did not reach area 11 within 3600s: ${JSON.stringify(result.deepRun)}`);
}
const [first, ...repeats] = result.runResults;
if (!first || first.seconds < result.target.first[0] || first.seconds > result.target.first[1]) {
  failures.push(`first prestige ${first?.seconds ?? "missing"}s outside ${result.target.first.join("-")}s`);
}
for (const run of repeats) {
  if (run.seconds < result.target.repeat[0] || run.seconds > result.target.repeat[1]) {
    failures.push(`repeat prestige run ${run.run} ${run.seconds}s outside ${result.target.repeat.join("-")}s`);
  }
}

console.log(JSON.stringify({ ok: failures.length === 0, ...result, failures }, null, 2));
if (failures.length && process.env.BALANCE_CALIBRATE !== "1") process.exit(1);
