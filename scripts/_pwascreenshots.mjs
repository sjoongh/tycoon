import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to capture PWA screenshots from non-local host: ${parsedUrl.hostname}`);
}

await mkdir("public/screenshots", { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(10000);
await page.route("**/*", async (route) => {
  const hostname = new URL(route.request().url()).hostname;
  if (["localhost", "127.0.0.1"].includes(hostname)) await route.continue();
  else await route.abort("blockedbyclient");
});

try {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game?.registry.get("gameState") && document.querySelector(".gp-hud"));
  const skip = page.locator("[data-skip]");
  if (await skip.count()) await skip.click();

  await page.evaluate(() => {
    const gameState = window.__game.registry.get("gameState");
    const world = window.__game.scene.getScene("GameScene").world;
    gameState.data.paused = true;
    gameState.data.tutorial = { step: 5, done: true, openingSeen: true };
    gameState.data.votes = 18420;
    gameState.data.explain = 930;
    gameState.data.trust = 86;
    gameState.data.stage.area = 4;
    gameState.data.stage.progress = Math.floor(gameState.stageTarget(4) * 0.58);
    gameState.data.stage.target = gameState.stageTarget(4);
    gameState.data.facilities = { desk: 15, sorter: 10, notice: 5, server: 5, archive: 5, studio: 0 };
    gameState.data.staff = { clerk: 15, auditor: 10, runner: 5, engineer: 5, analyst: 1, speaker: 0 };
    gameState.data.staffSlots = ["clerk", "auditor", "engineer"];
    gameState.data.activeTab = "crew";
    // 캡처용 상태 점프를 실제 구역 돌파로 오인해 외신 타이머를 예약하지 않게 맞춘다.
    world._prevArea = gameState.data.stage.area;
    gameState.emit("changed");
    [world?._incomeTimer, world?._govIdleTimer, world?._speakTimer, world?._pressTimer].forEach((timer) => {
      if (timer) timer.paused = true;
    });
  });
  await page.locator('[data-tab="crew"]').click();
  await page.locator(".gp-fieldslots").waitFor({ state: "visible" });
  await page.waitForFunction(() => !document.querySelector(".gp-banner"), null, { timeout: 12000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "public/screenshots/game-mobile.png" });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "public/screenshots/game-wide.png" });
  console.log(JSON.stringify({ ok: true, mobile: "390x844", wide: "1280x900", tab: "crew", slots: 3 }, null, 2));
} finally {
  await browser.close();
}
