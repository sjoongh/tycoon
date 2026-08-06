import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:4178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run PWA E2E against non-local host: ${parsedUrl.hostname}`);
}

const serviceWorkerPath = resolve("dist/sw.js");
const originalServiceWorker = await readFile(serviceWorkerPath, "utf8");
if (originalServiceWorker.includes("__BUILD_HASH__") || !/const CACHE_NAME = "trust-office-shell-[0-9a-f]{12}";/.test(originalServiceWorker)) {
  throw new Error("Production service worker does not contain an injected build hash");
}
const firebase = JSON.parse(await readFile(resolve("firebase.json"), "utf8"));
const swHeader = firebase.hosting?.headers?.find((entry) => entry.source === "/sw.js")?.headers || [];
const indexSources = ["/", "/index.html"];
const indexesRevalidate = indexSources.every((source) => firebase.hosting?.headers
  ?.find((entry) => entry.source === source)?.headers
  ?.some((header) => header.key === "Cache-Control" && header.value.includes("no-cache")));
if (firebase.hosting?.public !== "dist" || !swHeader.some((header) => header.key === "Cache-Control" && header.value.includes("no-cache")) || !indexesRevalidate) {
  throw new Error(`Firebase Hosting contract mismatch: ${JSON.stringify(firebase.hosting)}`);
}
await access(resolve("dist/privacy.html"));
const updateToken = `e2e-${Date.now()}`;
const updatedServiceWorker = originalServiceWorker
  .replace(/const CACHE_NAME = "[^"]+";/, `const CACHE_NAME = "trust-office-shell-${updateToken}";`)
  .concat(`\n// ${updateToken}\n`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow" });
const page = await context.newPage();
page.setDefaultTimeout(15000);

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator(".gp-hud").waitFor({ state: "visible" });
  const skip = page.locator("[data-skip]");
  if (await skip.count()) await skip.click();

  const installAssets = await page.evaluate(async () => {
    const manifestResponse = await fetch("/manifest.webmanifest");
    const manifest = await manifestResponse.json();
    const expected = new Map([
      ["/icons/icon-192.png", [192, 192]],
      ["/icons/icon-512.png", [512, 512]],
      ["/icons/icon-maskable-512.png", [512, 512]],
      ["/screenshots/game-mobile.png", [390, 844]],
      ["/screenshots/game-wide.png", [1280, 900]],
    ]);
    const dimensions = {};
    for (const [src, [width, height]] of expected) {
      dimensions[src] = await new Promise((resolvePromise, reject) => {
        const image = new Image();
        image.onload = () => resolvePromise([image.naturalWidth, image.naturalHeight]);
        image.onerror = reject;
        image.src = src;
      });
      if (dimensions[src][0] !== width || dimensions[src][1] !== height) throw new Error(`${src} dimension mismatch: ${dimensions[src]}`);
    }
    const privacy = await fetch("/privacy.html");
    return {
      manifestStatus: manifestResponse.status,
      iconCount: manifest.icons?.length || 0,
      screenshotCount: manifest.screenshots?.length || 0,
      dimensions,
      privacyStatus: privacy.status,
    };
  });
  if (installAssets.manifestStatus !== 200 || installAssets.iconCount !== 3 || installAssets.screenshotCount !== 2 || installAssets.privacyStatus !== 200) {
    throw new Error(`install asset contract mismatch: ${JSON.stringify(installAssets)}`);
  }

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolvePromise) => navigator.serviceWorker.addEventListener("controllerchange", resolvePromise, { once: true }));
    }
  });

  await writeFile(serviceWorkerPath, updatedServiceWorker);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error("service worker registration missing");
    await registration.update();
  });

  const prompt = page.locator(".gp-update");
  await prompt.waitFor({ state: "visible" });
  const promptText = (await prompt.textContent())?.replace(/\s+/g, " ").trim();
  if (!promptText?.includes("새 공문 도착") || !promptText.includes("지금 갱신") || !promptText.includes("나중에")) {
    throw new Error(`update choice copy mismatch: ${promptText}`);
  }

  const savedBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("trust-office-phaser-v2") || "null")?.lastSavedAt || 0);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }),
    page.locator('[data-update="apply"]').click(),
  ]);
  await page.locator(".gp-hud").waitFor({ state: "visible" });

  const afterUpdate = await page.evaluate(async () => {
    const saved = JSON.parse(localStorage.getItem("trust-office-phaser-v2") || "null");
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      savedAt: saved?.lastSavedAt || 0,
      controlled: Boolean(navigator.serviceWorker.controller),
      waiting: Boolean(registration?.waiting),
      caches: await caches.keys(),
    };
  });
  if (afterUpdate.savedAt <= savedBefore || !afterUpdate.controlled || afterUpdate.waiting) {
    throw new Error(`update activation mismatch: ${JSON.stringify({ savedBefore, afterUpdate })}`);
  }
  if (!afterUpdate.caches.some((name) => name.includes(updateToken))) {
    throw new Error(`updated cache missing: ${JSON.stringify(afterUpdate.caches)}`);
  }

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 20000 });
  await page.locator(".gp-hud").waitFor({ state: "visible" });
  const offlineTitle = await page.title();

  console.log(JSON.stringify({
    ok: true,
    target: baseUrl,
    installAssets,
    promptText,
    savedBefore,
    savedAfter: afterUpdate.savedAt,
    updatedCache: afterUpdate.caches.find((name) => name.includes(updateToken)),
    offlineReload: offlineTitle,
  }, null, 2));
} finally {
  await context.setOffline(false).catch(() => {});
  await context.close();
  await browser.close();
  await writeFile(serviceWorkerPath, originalServiceWorker);
}
