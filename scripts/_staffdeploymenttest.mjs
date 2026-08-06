import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run staff E2E against non-local host: ${parsedUrl.hostname}`);
}

const evidenceDir = process.env.STAFF_EVIDENCE_DIR || ".qa-test-automations/evidence/2026-08-06/screenshots";
await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(10000);
const errors = [];
await page.route("**/*", async (route) => {
  const hostname = new URL(route.request().url()).hostname;
  if (["localhost", "127.0.0.1"].includes(hostname)) await route.continue();
  else await route.abort("blockedbyclient");
});
page.on("pageerror", (error) => errors.push(`PAGE ${error.message}`));
page.on("console", (message) => {
  const text = message.text();
  if (message.type() === "error" && !text.includes("firebase_analytics") && !text.includes("ERR_BLOCKED_BY_CLIENT")) errors.push(`CONSOLE ${text}`);
});

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game?.registry.get("gameState") && document.querySelector(".gp-hud"));
  const skip = page.locator("[data-skip]");
  if (await skip.count()) await skip.click();
  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    gameState.data.paused = true;
    gameState.data.tutorial = { step: 5, done: true, openingSeen: true };
    gameState.data.votes = 1_000_000_000;
    gameState.data.explain = 1_000_000;
    gameState.emit("changed");
  });

  await page.locator('[data-tab="crew"]').click();
  for (const id of ["clerk", "auditor", "runner", "engineer"]) {
    const hire = page.locator(`[data-action="hire"][data-id="${id}"]`);
    await hire.scrollIntoViewIfNeeded();
    await hire.click();
    await page.waitForTimeout(120);
  }

  const automatic = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    return {
      slots: gameState.staffSlots(),
      world: Object.keys(window.__game.scene.getScene("GameScene").world._workers),
      engineerLevel: gameState.staffLevel("engineer"),
    };
  });
  if (JSON.stringify(automatic.slots) !== JSON.stringify(["clerk", "auditor", "runner"]) || automatic.world.length !== 3 || automatic.engineerLevel !== 1) {
    throw new Error(`automatic deployment mismatch: ${JSON.stringify(automatic)}`);
  }

  for (let level = 2; level <= 5; level += 1) {
    const hire = page.locator('[data-action="hire"][data-id="clerk"]');
    await hire.scrollIntoViewIfNeeded();
    await hire.click();
    await page.waitForTimeout(120);
  }
  const promotion = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    const worker = window.__game.scene.getScene("GameScene").world._workers.clerk;
    return { level: gameState.staffLevel("clerk"), rank: gameState.staffRank("clerk"), worldRank: worker?.rank, texture: worker?.badge?.texture?.key };
  });
  if (promotion.level !== 5 || promotion.rank?.tier !== 2 || promotion.worldRank !== 2 || promotion.texture !== "worker-rank-2") {
    throw new Error(`promotion mismatch: ${JSON.stringify(promotion)}`);
  }

  await page.locator('.gp-fieldslot[data-action="undeployStaff"][data-id="clerk"]').click();
  const deployEngineer = page.locator('[data-action="deployStaff"][data-id="engineer"]');
  await deployEngineer.scrollIntoViewIfNeeded();
  await deployEngineer.click();
  await page.waitForTimeout(200);
  const swapped = await page.evaluate(() => window.__game.registry.get("gameState").staffSlots());
  if (JSON.stringify(swapped) !== JSON.stringify(["auditor", "runner", "engineer"])) {
    throw new Error(`manual swap mismatch: ${JSON.stringify(swapped)}`);
  }
  const savedBeforeReload = await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    const saved = JSON.parse(localStorage.getItem("trust-office-phaser-v2") || "null");
    let normalizeError = null;
    try { gameState.normalize(saved, Date.now()); } catch (error) { normalizeError = `${error.message}\n${error.stack}`; }
    return { version: saved?.version, staff: saved?.staff, slots: saved?.staffSlots, normalizeError };
  });
  if (savedBeforeReload.version !== 9 || JSON.stringify(savedBeforeReload.slots) !== JSON.stringify(swapped) || savedBeforeReload.normalizeError) {
    throw new Error(`deployment was not saved before reload: ${JSON.stringify(savedBeforeReload)}`);
  }

  await page.screenshot({ path: `${evidenceDir}/SC-STAFF-001-deployment-promotion-mobile.png` });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__game?.registry.get("gameState") && document.querySelector(".gp-hud"));
  const loadedBeforeModals = await page.evaluate(() => ({
    slots: window.__game.registry.get("gameState").staffSlots(),
    staff: window.__game.registry.get("gameState").data.staff,
    saved: JSON.parse(localStorage.getItem("trust-office-phaser-v2") || "null")?.staffSlots,
  }));
  const revisitModals = [];
  for (let modal = 0; modal < 6; modal += 1) {
    const overlay = page.locator(".gp-modal-ov").first();
    if (!(await overlay.count()) || !(await overlay.isVisible().catch(() => false))) break;
    revisitModals.push((await overlay.textContent())?.replace(/\s+/g, " ").trim());
    const close = overlay.locator("button:visible").last();
    if (!(await close.count())) throw new Error(`revisit modal has no action: ${revisitModals.at(-1)}`);
    await close.click();
    await page.waitForTimeout(100);
  }
  await page.locator('[data-tab="crew"]').click();
  await page.locator(".gp-fieldslots").waitFor({ state: "visible" });
  const persisted = await page.evaluate(() => ({
    slots: window.__game.registry.get("gameState").staffSlots(),
    world: Object.keys(window.__game.scene.getScene("GameScene").world._workers),
  }));
  if (JSON.stringify(persisted.slots) !== JSON.stringify(swapped) || JSON.stringify(persisted.world) !== JSON.stringify(swapped)) {
    throw new Error(`persisted deployment mismatch: ${JSON.stringify({ savedBeforeReload, loadedBeforeModals, revisitModals, persisted })}`);
  }

  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(150);
  const accessibility = await page.evaluate(() => {
    const rects = [...document.querySelectorAll(".gp-fieldslot, .gp-staff__deploy")]
      .filter((element) => getComputedStyle(element).display !== "none")
      .map((element) => ({ className: element.className, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }));
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      minimumHeight: Math.min(...rects.map((rect) => rect.height)),
      rects,
    };
  });
  if (accessibility.overflow || accessibility.minimumHeight < 44) {
    throw new Error(`compact staff targets mismatch: ${JSON.stringify(accessibility)}`);
  }
  await page.screenshot({ path: `${evidenceDir}/SC-STAFF-002-persisted-compact.png` });

  if (errors.length) throw new Error(errors.join(" | "));
  console.log(JSON.stringify({ ok: true, target: baseUrl, automatic, promotion, swapped, savedBeforeReload, loadedBeforeModals, persisted, revisitModals, accessibility: { overflow: accessibility.overflow, minimumHeight: accessibility.minimumHeight }, screenshots: 2 }, null, 2));
} finally {
  await browser.close();
}
