import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:5178";
const parsedUrl = new URL(baseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  throw new Error(`REFUSING to run startup/font E2E against non-local host: ${parsedUrl.hostname}`);
}

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const screenshotDir = ".qa-test-automations/evidence/2026-08-06/screenshots";
mkdirSync(screenshotDir, { recursive: true });

async function newGuardedPage() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  await page.route("**/*", async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (["localhost", "127.0.0.1"].includes(hostname)) await route.continue();
    else await route.abort("blockedbyclient");
  });
  await page.addInitScript(() => {
    localStorage.clear();
    window.__qaFirebaseEntries = (since = 0) => performance.getEntriesByType("resource")
      .filter((entry) => entry.startTime >= since && new URL(entry.name).pathname.includes("/node_modules/.vite/deps/firebase_"))
      .map((entry) => ({ path: new URL(entry.name).pathname, startTime: entry.startTime, transferSize: entry.transferSize }));
  });
  return { context, page };
}

try {
  const quietRun = await newGuardedPage();
  await quietRun.page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await quietRun.page.waitForTimeout(700);
  const quietTiming = await quietRun.page.evaluate(async () => {
    const firstInputAt = performance.now();
    let lastInputAt = firstInputAt;
    for (let index = 0; index < 10; index += 1) {
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      lastInputAt = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const duringInput = window.__qaFirebaseEntries(firstInputAt);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const afterQuiet = window.__qaFirebaseEntries(firstInputAt);
    return {
      firstInputAt,
      lastInputAt,
      duringInput,
      afterQuiet,
      quietDelayMs: afterQuiet.length ? afterQuiet[0].startTime - lastInputAt : null,
    };
  });

  await quietRun.page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('9px "Galmuri9"', "믿어주세요 개표국 1234567890"),
      document.fonts.load('14px "Galmuri14"', "믿어주세요 개표국 1234567890"),
      document.fonts.load('11px "Galmuri11"', "희귀닉네임힣"),
    ]);
    const specimen = document.createElement("div");
    specimen.id = "qa-font-specimen";
    specimen.style.cssText = "position:fixed;left:12px;right:12px;top:170px;z-index:9999;padding:12px;background:#1a1c2c;border:3px solid #ffcd75;color:#fff;line-height:1.7";
    specimen.innerHTML = `
      <div id="qa-font-small" style="font-family:Galmuri9,Galmuri11,monospace;font-size:9px">작은 개표 문구 1234567890</div>
      <div id="qa-font-bold" style="font-family:Galmuri14,Galmuri11,monospace;font-size:14px">믿어주세요 개표국 101표</div>
      <div id="qa-font-rare" style="font-family:Galmuri9,Galmuri11,monospace;font-size:9px">희귀닉네임힣</div>`;
    document.body.appendChild(specimen);
  });

  const cdp = await quietRun.context.newCDPSession(quietRun.page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const documentNode = await cdp.send("DOM.getDocument");
  const platformFonts = {};
  for (const id of ["qa-font-small", "qa-font-bold", "qa-font-rare"]) {
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: documentNode.root.nodeId, selector: `#${id}` });
    platformFonts[id] = (await cdp.send("CSS.getPlatformFontsForNode", { nodeId })).fonts;
  }
  const fontNetwork = await quietRun.page.evaluate(() => {
    const fonts = performance.getEntriesByType("resource")
      .filter((entry) => new URL(entry.name).pathname.includes("/fonts/"))
      .map((entry) => ({ path: new URL(entry.name).pathname, transferSize: entry.transferSize }));
    return { fonts, transferBytes: fonts.reduce((sum, entry) => sum + entry.transferSize, 0) };
  });
  await quietRun.page.screenshot({ path: `${screenshotDir}/SC-MRT-006-font-subset-mobile.png`, fullPage: true });
  await quietRun.context.close();

  const deadlineRun = await newGuardedPage();
  await deadlineRun.page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const deadlineStartedAt = await deadlineRun.page.evaluate(() => performance.now());
  await deadlineRun.page.waitForTimeout(5300);
  const deadlineTiming = await deadlineRun.page.evaluate(({ since }) => {
    const entries = window.__qaFirebaseEntries(since);
    return { entries, firstStartMs: entries.length ? entries[0].startTime - since : null };
  }, { since: deadlineStartedAt });
  await deadlineRun.context.close();

  const leaderboardRun = await newGuardedPage();
  await leaderboardRun.page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await leaderboardRun.page.waitForTimeout(700);
  const leaderboardTiming = await leaderboardRun.page.evaluate(async () => {
    const dispatchedAt = performance.now();
    document.dispatchEvent(new CustomEvent("gp:open-leaderboard"));
    const deadline = dispatchedAt + 500;
    let entries = [];
    while (performance.now() < deadline) {
      entries = window.__qaFirebaseEntries(dispatchedAt);
      if (entries.length) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return { entries, firstStartMs: entries.length ? entries[0].startTime - dispatchedAt : null };
  });
  await leaderboardRun.context.close();

  const failures = [];
  if (quietTiming.duringInput.length) failures.push("Firebase SDK started while pointer input was still continuous");
  if (quietTiming.quietDelayMs === null || quietTiming.quietDelayMs < 700 || quietTiming.quietDelayMs > 1400) {
    failures.push(`Firebase idle start delay was ${quietTiming.quietDelayMs}ms after the final input`);
  }
  if (deadlineTiming.firstStartMs === null || deadlineTiming.firstStartMs < 4800 || deadlineTiming.firstStartMs > 5250) {
    failures.push(`Firebase 5s deadline started at ${deadlineTiming.firstStartMs}ms`);
  }
  if (leaderboardTiming.firstStartMs === null || leaderboardTiming.firstStartMs > 300) {
    failures.push(`Leaderboard did not force immediate cloud startup (${leaderboardTiming.firstStartMs}ms)`);
  }
  if (fontNetwork.transferBytes > 600_000) failures.push(`Font transfer ${fontNetwork.transferBytes} bytes exceeded 600000`);
  const boldFamilies = platformFonts["qa-font-bold"].map((font) => font.familyName);
  const rareFamilies = platformFonts["qa-font-rare"].map((font) => font.familyName);
  if (!boldFamilies.some((family) => family.includes("Galmuri14"))) failures.push("Static bold specimen did not use Galmuri14");
  if (!rareFamilies.some((family) => family.includes("Galmuri11"))) failures.push("Rare nickname glyph did not fall back to full Galmuri11");

  const output = {
    ok: failures.length === 0,
    target: baseUrl,
    quietTiming,
    deadlineTiming,
    leaderboardTiming,
    fontNetwork,
    platformFonts,
    failures,
  };
  console.log(JSON.stringify(output, null, 2));
  if (failures.length) throw new Error(failures.join(" | "));
} finally {
  await browser.close();
}
