// Usage: node scripts/shot.mjs <outPath> [seeded|fresh] [tab]
import { chromium } from "playwright";

const out = process.argv[2] || "/tmp/gaepyo-shot.png";
const mode = process.argv[3] || "seeded";
const tab = process.argv[4] || "facilities";
const URL = "http://localhost:5178/";
const SAVE_KEY = "trust-office-phaser-v2";

const now = Date.now();
const seed = {
  version: 3,
  votes: 5_000_000,
  explain: 8000,
  trust: 78,
  days: 18,
  paused: false,
  selected: "desk",
  activeTab: tab,
  tutorial: { step: 5, done: true },
  lastSavedAt: now,
  lastSeenAt: now,
  facilities: { desk: 16, sorter: 9, notice: 6, server: 5, archive: 4, studio: 2 },
  staff: { clerk: 3, auditor: 2, engineer: 1, speaker: 1 },
  stage: { area: 5, progress: 500, target: 99999, completed: 4 },
  prestige: { seals: 3, runs: 1, bestArea: 5, totalSeals: 5, upgrades: { procedure: 1, manual: 0, briefing: 0, night: 0 } },
  stats: { totalVotes: 0, totalClicks: 0, totalUpgrades: 0, totalEvents: 2, totalOfflineMs: 0 },
  achievements: {},
  quests: {},
  log: ["개표국 개국", "2구역 개표 완료"],
};

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
if (mode === "offline") seed.lastSeenAt = now - 2 * 3600 * 1000; // 2h ago -> offline reward
if (mode === "seeded" || mode === "offline") {
  await page.addInitScript(([k, v]) => { localStorage.setItem(k, v); }, [SAVE_KEY, JSON.stringify(seed)]);
}
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERR: " + e.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
await page.screenshot({ path: out });
await browser.close();
console.log("shot:", out);
if (errors.length) console.log("CONSOLE_ERRORS:\n" + errors.slice(0, 20).join("\n"));
else console.log("no console errors");
