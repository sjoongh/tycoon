import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const expectedBuild = process.env.QA_EXPECTED_PHASER_BUILD || "custom";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run Phaser core E2E against non-local host: ${parsedUrl.hostname}`);
}

const screenshotDir = ".qa-test-automations/evidence/2026-08-06/screenshots";
mkdirSync(screenshotDir, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});

async function runRenderer(name, forceCanvas) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(10000);
  await page.route("**/*", async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (["localhost", "127.0.0.1"].includes(hostname)) await route.continue();
    else await route.abort("blockedbyclient");
  });
  await page.addInitScript(({ canvas }) => {
    localStorage.clear();
    if (canvas) {
      Object.defineProperty(window, "WebGLRenderingContext", { configurable: true, value: undefined });
      Object.defineProperty(window, "WebGL2RenderingContext", { configurable: true, value: undefined });
    }
  }, { canvas: forceCanvas });
  page.on("pageerror", (error) => errors.push(`PAGE ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const expectedExternalBlock = text.includes("ERR_BLOCKED_BY_CLIENT")
      || (text.includes("Failed to fetch") && text.includes("firebase_analytics.js"));
    if (!expectedExternalBlock) errors.push(`CONSOLE ${text}`);
  });
  page.on("requestfailed", (request) => {
    const hostname = new URL(request.url()).hostname;
    if (["localhost", "127.0.0.1"].includes(hostname)) errors.push(`NETWORK ${request.url()} ${request.failure()?.errorText || "failed"}`);
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => {
    const scene = window.__game?.scene.getScene("GameScene");
    return window.__game?.registry.get("gameState") && scene?.world && document.querySelector(".gp-hud");
  });
  for (let index = 0; index < 5; index += 1) {
    const next = page.locator(".gp-modal [data-next]").first();
    if (!(await next.count()) || !(await next.isVisible().catch(() => false))) break;
    await next.click();
  }

  const beforeClicks = await page.evaluate(() => window.__game.registry.get("gameState").data.stats.totalClicks);
  await page.mouse.click(195, 360);
  await page.waitForFunction((before) => window.__game.registry.get("gameState").data.stats.totalClicks > before, beforeClicks);
  const state = await page.evaluate(() => {
    const game = window.__game;
    const scene = game.scene.getScene("GameScene");
    const canvas = game.canvas;
    let uniqueCanvasColors = null;
    if (game.renderer.type === 1) {
      const context2d = canvas.getContext("2d", { willReadFrequently: true });
      const data = context2d.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set();
      for (let y = 0; y < canvas.height; y += 42) {
        for (let x = 0; x < canvas.width; x += 20) {
          const offset = (y * canvas.width + x) * 4;
          colors.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]},${data[offset + 3]}`);
        }
      }
      uniqueCanvasColors = colors.size;
    }
    return {
      build: window.__phaserBuild,
      rendererType: game.renderer.type,
      expectedRendererType: game.device.features.webGL ? 2 : 1,
      clicks: game.registry.get("gameState").data.stats.totalClicks,
      factories: {
        graphics: typeof scene.add.graphics,
        text: typeof scene.add.text,
        rectangle: typeof scene.add.rectangle,
        image: typeof scene.add.image,
        circle: typeof scene.add.circle,
        sprite: typeof scene.add.sprite,
        zone: typeof scene.add.zone,
      },
      systems: {
        input: Boolean(scene.input),
        loader: Boolean(scene.load),
        scale: Boolean(game.scale),
        time: Boolean(scene.time),
        tweens: Boolean(scene.tweens),
      },
      canvasSize: { width: canvas.width, height: canvas.height },
      uniqueCanvasColors,
    };
  });
  const screenshotName = expectedBuild === "custom" ? name : `${expectedBuild}-${name}`;
  await page.screenshot({ path: `${screenshotDir}/SC-MRT-008-phaser-${screenshotName}.png`, fullPage: true });
  await context.close();

  if (state.build !== expectedBuild) errors.push(`expected ${expectedBuild} build, received ${state.build}`);
  if (forceCanvas && state.rendererType !== 1) errors.push(`forced Canvas renderer type was ${state.rendererType}`);
  if (!forceCanvas && state.rendererType !== 2) errors.push(`WebGL renderer type was ${state.rendererType}`);
  if (Object.values(state.factories).some((value) => value !== "function")) errors.push(`missing factory: ${JSON.stringify(state.factories)}`);
  if (Object.values(state.systems).some((value) => !value)) errors.push(`missing scene system: ${JSON.stringify(state.systems)}`);
  if (state.clicks <= beforeClicks) errors.push("canvas tap did not increment totalClicks");
  if (forceCanvas && (state.uniqueCanvasColors ?? 0) < 4) errors.push(`Canvas output had only ${state.uniqueCanvasColors} sampled colors`);
  return { name, forceCanvas, state, errors };
}

try {
  const webgl = await runRenderer("webgl", false);
  const canvas = await runRenderer("canvas", true);
  const failures = [...webgl.errors, ...canvas.errors];
  console.log(JSON.stringify({ ok: failures.length === 0, target: baseUrl, expectedBuild, webgl, canvas, failures }, null, 2));
  if (failures.length) throw new Error(failures.join(" | "));
} finally {
  await browser.close();
}
