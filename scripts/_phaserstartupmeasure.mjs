import { chromium } from "playwright";

const stockUrl = process.env.QA_STOCK_URL || "http://127.0.0.1:4178";
const customUrl = process.env.QA_CUSTOM_URL || "http://127.0.0.1:4181";
const runs = Number(process.env.QA_PERF_RUNS) || 3;
for (const value of [stockUrl, customUrl]) {
  const hostname = new URL(value).hostname;
  if (!["localhost", "127.0.0.1"].includes(hostname)) throw new Error(`REFUSING startup measurement against non-local host: ${hostname}`);
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function sample(baseUrl, run) {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    await page.route("**/*", async (route) => {
      const hostname = new URL(route.request().url()).hostname;
      if (["localhost", "127.0.0.1"].includes(hostname)) await route.continue();
      else await route.abort("blockedbyclient");
    });
    await page.addInitScript(() => {
      localStorage.clear();
      window.__qaBoot = { longtasks: [], hudAt: null, worldAt: null };
      new PerformanceObserver((list) => {
        window.__qaBoot.longtasks.push(...list.getEntries().map((entry) => ({
          start: Number(entry.startTime.toFixed(1)),
          duration: Number(entry.duration.toFixed(1)),
        })));
      }).observe({ entryTypes: ["longtask"] });
      document.addEventListener("gp:world-ready", () => { window.__qaBoot.worldAt = performance.now(); });
      const poll = () => {
        if (window.__qaBoot.hudAt === null && document.querySelector(".gp-hud")) window.__qaBoot.hudAt = performance.now();
        if (window.__qaBoot.hudAt === null) requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    });
    page.on("pageerror", (error) => errors.push(`PAGE ${error.message}`));
    page.on("requestfailed", (request) => {
      const hostname = new URL(request.url()).hostname;
      if (["localhost", "127.0.0.1"].includes(hostname)) errors.push(`NETWORK ${request.url()} ${request.failure()?.errorText || "failed"}`);
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await page.goto(`${baseUrl}/?qa-perf=${run}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(() => window.__qaBoot.worldAt !== null && document.querySelector(".gp-hud"), null, { timeout: 15000 });
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const phaser = performance.getEntriesByType("resource").find((entry) => /\/assets\/phaser-/.test(entry.name));
      const probe = window.__qaBoot;
      return {
        dclMs: Number(navigation.domContentLoadedEventEnd.toFixed(1)),
        hudMs: Number(probe.hudAt.toFixed(1)),
        worldMs: Number(probe.worldAt.toFixed(1)),
        longTaskTotalMs: Number(probe.longtasks.reduce((sum, entry) => sum + entry.duration, 0).toFixed(1)),
        longTaskMaxMs: Number(Math.max(0, ...probe.longtasks.map((entry) => entry.duration)).toFixed(1)),
        longTasks: probe.longtasks,
        phaserBytes: phaser?.encodedBodySize ?? null,
      };
    });
    return { ...result, errors };
  } finally {
    await browser.close();
  }
}

function summarize(samples) {
  return {
    samples,
    median: {
      dclMs: median(samples.map((value) => value.dclMs)),
      hudMs: median(samples.map((value) => value.hudMs)),
      worldMs: median(samples.map((value) => value.worldMs)),
      longTaskTotalMs: median(samples.map((value) => value.longTaskTotalMs)),
      longTaskMaxMs: median(samples.map((value) => value.longTaskMaxMs)),
      phaserBytes: median(samples.map((value) => value.phaserBytes)),
    },
  };
}

const warmups = [await sample(stockUrl, "warmup"), await sample(customUrl, "warmup")];
const collected = { stock: [], custom: [] };
for (let run = 0; run < runs; run += 1) {
  const order = run % 2 === 0
    ? [["custom", customUrl], ["stock", stockUrl]]
    : [["stock", stockUrl], ["custom", customUrl]];
  for (const [name, url] of order) collected[name].push(await sample(url, run));
}
const stock = summarize(collected.stock);
const custom = summarize(collected.custom);
const failures = [...warmups, ...stock.samples, ...custom.samples].flatMap((value) => value.errors);
if (custom.median.phaserBytes > 200_000 || custom.median.phaserBytes >= stock.median.phaserBytes * 0.7) {
  failures.push(`custom Phaser transfer ${custom.median.phaserBytes} was not at least 30% below stock ${stock.median.phaserBytes}`);
}
if (custom.median.longTaskTotalMs >= stock.median.longTaskTotalMs * 0.75) {
  failures.push(`custom total long task ${custom.median.longTaskTotalMs}ms was not at least 25% below stock ${stock.median.longTaskTotalMs}ms`);
}
if (custom.median.longTaskMaxMs >= stock.median.longTaskMaxMs * 0.85) {
  failures.push(`custom max long task ${custom.median.longTaskMaxMs}ms was not at least 15% below stock ${stock.median.longTaskMaxMs}ms`);
}
const reduction = {
  phaserBytesPct: Number(((1 - custom.median.phaserBytes / stock.median.phaserBytes) * 100).toFixed(1)),
  longTaskTotalPct: Number(((1 - custom.median.longTaskTotalMs / stock.median.longTaskTotalMs) * 100).toFixed(1)),
  longTaskMaxPct: Number(((1 - custom.median.longTaskMaxMs / stock.median.longTaskMaxMs) * 100).toFixed(1)),
  worldReadyPct: Number(((1 - custom.median.worldMs / stock.median.worldMs) * 100).toFixed(1)),
};
console.log(JSON.stringify({
  ok: failures.length === 0,
  runs,
  methodology: { discardedWarmupsPerBuild: 1, measuredOrder: "alternating", freshBrowserPerSample: true },
  stockUrl,
  customUrl,
  stock,
  custom,
  reduction,
  failures,
}, null, 2));
if (failures.length) throw new Error(failures.join(" | "));
