// Drive an upgrade across a milestone (Lv24->25) to verify toast+flash.
import { chromium } from "playwright";
const out = process.argv[2] || "/tmp/ms.png";
const SAVE_KEY = "trust-office-phaser-v2";
const now = Date.now();
const seed = {
  version: 3, votes: 5_000_000, explain: 8000, trust: 78, days: 18, paused: false,
  selected: "desk", activeTab: "facilities", tutorial: { step: 5, done: true },
  lastSavedAt: now, lastSeenAt: now,
  facilities: { desk: 24, sorter: 9, notice: 6, server: 5, archive: 4, studio: 2 },
  staff: { clerk: 3, auditor: 2, engineer: 1, speaker: 1 },
  stage: { area: 5, progress: 500, target: 99999, completed: 4 },
  prestige: { seals: 3, runs: 1, bestArea: 5, totalSeals: 5, upgrades: { procedure: 1, manual: 0, briefing: 0, night: 0 } },
  stats: { totalVotes: 0, totalClicks: 5, totalUpgrades: 0, totalEvents: 2, totalOfflineMs: 0 },
  achievements: {}, quests: {}, log: ["개표국 개국"],
};
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [SAVE_KEY, JSON.stringify(seed)]);
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:5178/", { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
// click upgrade (desk 24 -> 25 = milestone)
await page.click('[data-action="upgradeFac"]');
await page.waitForTimeout(500);
await page.screenshot({ path: out });
await browser.close();
console.log("shot:", out, errs.length ? "ERR:" + errs.join("|") : "ok");
