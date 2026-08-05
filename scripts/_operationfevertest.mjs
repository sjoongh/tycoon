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
  if (message.type() === "error" && !message.text().includes("navigator.vibrate")) {
    errors.push(`CONSOLE ${message.text()}`);
  }
});
page.on("requestfailed", (request) => {
  const requestUrl = new URL(request.url());
  if (["localhost", "127.0.0.1"].includes(requestUrl.hostname)) {
    errors.push(`NETWORK ${request.url()} ${request.failure()?.errorText || "failed"}`);
  }
});
try {
await page.addInitScript(() => {
  if (sessionStorage.getItem("ztest-qa-gaepyo-cleared")) return;
  localStorage.clear();
  sessionStorage.setItem("ztest-qa-gaepyo-cleared", "1");
});
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

for (let index = 0; index < 4; index += 1) {
  const next = page.locator(".gp-modal [data-next]");
  if (await next.count()) await next.click();
  await page.waitForTimeout(80);
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

const operationCards = page.locator("[data-operation]");
if (await operationCards.count() !== 3) throw new Error("operation draft did not render exactly three choices");
const focused = await page.evaluate(() => document.activeElement?.matches?.("[data-operation]") || false);
if (!focused) throw new Error("operation draft did not focus the first choice");
const recommendations = await page.locator(".gp-opcard__meta em").count();
if (recommendations !== 1) throw new Error(`expected one behavior recommendation, got ${recommendations}`);
const touchTargets = await operationCards.evaluateAll((cards) => cards.map((card) => {
  const rect = card.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}));
if (touchTargets.some((target) => target.width < 44 || target.height < 44)) throw new Error("operation card touch target is below 44px");
await page.screenshot({ path: `${evidenceDir}/SC-OPF-002-step-1-mobile-draft.png` });

const selectedId = await operationCards.first().getAttribute("data-operation");
await operationCards.first().click();
await page.waitForTimeout(160);
const selectedState = await page.evaluate((id) => {
  const gameState = window.__game.registry.get("gameState");
  return {
    level: gameState.operationLevel(id),
    charge: gameState.feverCharge(),
    draft: gameState.data.operations.draft,
  };
}, selectedId);
if (selectedState.level !== 1 || selectedState.charge !== 12 || selectedState.draft !== null) {
  throw new Error(`operation selection state mismatch: ${JSON.stringify(selectedState)}`);
}
await page.screenshot({ path: `${evidenceDir}/SC-OPF-002-step-2-mobile-selected.png` });

await page.locator('[data-k="fever"]').click();
await page.waitForTimeout(350);
const statusState = {
  families: await page.locator(".gp-opstatus__family").count(),
  picks: await page.locator(".gp-opstatus__pick").count(),
  overlays: await page.locator(".gp-modal-ov").count(),
  visual: await page.locator(".gp-modal:has(.gp-opstatus__family)").evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { opacity: style.opacity, background: style.backgroundColor, animation: style.animationName, width: rect.width, height: rect.height };
  }),
};
if (statusState.families !== 3 || statusState.picks < 1 || statusState.overlays !== 1 || Number(statusState.visual.opacity) < 0.99) {
  throw new Error(`operation status mismatch: ${JSON.stringify(statusState)}`);
}
await page.screenshot({ path: `${evidenceDir}/SC-OPF-002-step-3-mobile-status.png` });
await page.locator(".gp-modal [data-close]").click();

await page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  gameState.data.fever.charge = 99;
  gameState.emit("changed");
});
await page.mouse.click(195, 360);
await page.waitForTimeout(560);
const feverState = await page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  return {
    active: gameState.feverActive(),
    remaining: gameState.feverRemainingMs(),
    ratio: gameState.cps() / gameState.cpsFor(gameState.data),
    family: gameState.feverFamily(),
    expectedRatio: gameState.feverProfile().productionMult,
    label: document.querySelector('[data-k="fever-label"]')?.textContent,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
  };
});
if (!feverState.active || feverState.remaining < 10000 || Math.abs(feverState.ratio - feverState.expectedRatio) > 0.01) {
  throw new Error(`fever state mismatch: ${JSON.stringify(feverState)}`);
}
if (feverState.overflow) throw new Error("unexpected horizontal overflow on mobile");
await page.screenshot({ path: `${evidenceDir}/SC-OPF-003-step-4-mobile-fever.png` });

await page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  gameState.data.fever.endsAt = Date.now() + 3500;
  gameState.emit("changed");
});
await page.waitForTimeout(120);
const finisherButton = page.locator(".gp-rush--ready");
if (await finisherButton.count() !== 1) throw new Error("fever finisher did not appear in the final four seconds");
await finisherButton.click();
const finisherState = await page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  return {
    used: gameState.feverFinisherUsed(),
    production: gameState.feverProductionMultiplier(),
    baseProduction: gameState.feverProfile().productionMult,
  };
});
if (!finisherState.used || finisherState.production !== finisherState.baseProduction * 2) {
  throw new Error(`finisher state mismatch: ${JSON.stringify(finisherState)}`);
}
await page.screenshot({ path: `${evidenceDir}/SC-OPF-003-step-5-mobile-finisher.png` });

await page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  gameState.data.fever.endsAt = Date.now() - 1;
  gameState.syncFever();
});
await page.waitForTimeout(260);
const reportTitle = await page.locator(".gp-fever-recap__title").textContent();
if (!reportTitle?.includes("결산")) throw new Error(`fever report did not open: ${reportTitle}`);
const reportStats = await page.locator(".gp-fever-recap .gp-fever-report > div").count();
if (reportStats !== 3) throw new Error(`fever report stats mismatch: ${reportStats}`);
await page.screenshot({ path: `${evidenceDir}/SC-OPF-003-step-6-mobile-report.png` });
await page.locator(".gp-fever-recap__close").click();
await page.waitForTimeout(220);
const recoveryState = await page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  return {
    recovering: gameState.feverRecovering(),
    remaining: gameState.feverRecoveryRemainingMs(),
    blockedCharge: gameState.addFever("tap", 50).added,
    label: document.querySelector('[data-k="fever-label"]')?.textContent,
  };
});
if (!recoveryState.recovering || recoveryState.remaining < 28000 || recoveryState.blockedCharge !== 0) {
  throw new Error(`recovery state mismatch: ${JSON.stringify(recoveryState)}`);
}

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
const returnModal = page.locator(".gp-modal [data-confirm]");
if (await returnModal.count()) {
  await returnModal.first().click();
  await page.waitForTimeout(120);
}
const restoredLevel = await page.evaluate((id) => window.__game.registry.get("gameState").operationLevel(id), selectedId);
if (restoredLevel !== 1) throw new Error("selected operation did not survive reload");

await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  gameState.data.fever = { charge: 0, startsAt: 0, endsAt: 0, recoveryEndsAt: 0, family: null, finisherUsed: false, session: null, report: null };
  gameState.data.stage.area = 6;
  gameState.data.stage.target = gameState.stageTarget(6);
  gameState.data.stage.progress = gameState.data.stage.target;
  gameState.data.operations.draft = null;
  gameState.emit("changed");
});
await page.locator('[data-action="advanceStage"]').click();
await page.waitForTimeout(420);
await page.screenshot({ path: `${evidenceDir}/SC-OPF-002-step-1-desktop-draft.png` });
const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
if (desktopOverflow) throw new Error("unexpected horizontal overflow on desktop");

await page.emulateMedia({ reducedMotion: "reduce" });
await page.locator("[data-operation]").first().click();
await page.evaluate(() => {
  const gameState = window.__game.registry.get("gameState");
  gameState.data.fever.charge = 99;
  gameState.addFever("tap", 1);
  gameState.emit("changed");
});
const reducedAnimation = await page.locator(".gp-fever--active").evaluate((element) => getComputedStyle(element).animationName);
if (reducedAnimation !== "none") throw new Error(`reduced motion still animates fever: ${reducedAnimation}`);

if (errors.length) throw new Error(errors.join(" | "));
console.log(JSON.stringify({
  ok: true,
  target: baseUrl,
  mobile: { choices: 3, recommendations, selectedId, feverState, finisherState, recoveryState, statusState, touchTargets },
  desktop: { overflow: desktopOverflow },
  accessibility: { focused, reducedAnimation },
  screenshots: 7,
}, null, 2));
} finally {
  await browser.close();
}
