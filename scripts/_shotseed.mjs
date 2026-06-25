// Usage: node scripts/_shotseed.mjs <out> <area> <tab> [partial]
import { chromium } from "playwright";
const [out, areaArg, tab = "facilities", partial] = process.argv.slice(2);
const area = Number(areaArg || 1);
const URL = "http://localhost:5178/";
const SAVE_KEY = "trust-office-phaser-v2";
const now = Date.now();
// partial: low stats so quests/achievements are mid-progress (active + preview + locked achievements visible)
const lowStats = partial === "partial";
const seed = {
  version: 3,
  votes: lowStats ? 800 : 5_000_000,
  explain: lowStats ? 60 : 8000,
  trust: lowStats ? 55 : 78,
  days: 6,
  paused: false, selected: "desk", activeTab: tab,
  tutorial: { step: 5, done: true },
  lastSavedAt: now, lastSeenAt: now,
  facilities: lowStats ? { desk: 3, sorter: 1, notice: 0, server: 0, archive: 0, studio: 0 } : { desk: 16, sorter: 9, notice: 6, server: 5, archive: 4, studio: 2 },
  staff: lowStats ? { clerk: 1 } : { clerk: 3, auditor: 2, engineer: 1, speaker: 1 },
  stage: { area, progress: 200, target: 99999, completed: area - 1 },
  prestige: { seals: 1, runs: 0, bestArea: area, totalSeals: 1, upgrades: {} },
  stats: { totalVotes: lowStats ? 320 : 0, totalClicks: 0, totalUpgrades: 0, totalEvents: 1, totalOfflineMs: 0 },
  achievements: {}, quests: {},
  log: ["개표국 개국"],
};
const browser = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [SAVE_KEY, JSON.stringify(seed)]);
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
// scroll goals list to bottom so achievements are visible
if (tab === "goals") await page.evaluate(() => { const l = document.querySelector(".gp-goallist"); if (l) l.scrollTop = l.scrollHeight; });
await page.waitForTimeout(300);
await page.screenshot({ path: out });
await browser.close();
console.log(errs.length ? "ERR:" + errs.join(";") : "ok", out);
