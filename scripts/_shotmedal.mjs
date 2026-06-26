import { chromium } from "playwright";
const SAVE_KEY = "trust-office-phaser-v2"; const now = Date.now();
// 훈장 해금 상태(medals 보유) — 전당 그리드 + 디테일 카드 노출 확인용
const seed = { version: 3, votes: 1e9, explain: 1e6, trust: 80, days: 9, paused: false, selected: "desk", activeTab: "prestige",
  tutorial: { step: 5, done: true }, lastSavedAt: now, lastSeenAt: now,
  facilities: { desk: 20, sorter: 12, notice: 8, server: 6, archive: 5, studio: 3 }, staff: { clerk: 3, auditor: 2, engineer: 1, speaker: 1 },
  stage: { area: 12, progress: 200, target: 99999, completed: 11 },
  prestige: { seals: 40, runs: 4, bestArea: 12, totalSeals: 90, medals: 6, totalMedals: 9, medalBest: 12, medalUpgrades: { decree: 2, tenure: 1 }, upgrades: { audit: 3, procedure: 4, golden: 5 } },
  stats: { totalVotes: 9e8, totalClicks: 50, totalUpgrades: 30, totalEvents: 60, totalOfflineMs: 0 },
  achievements: {}, quests: {}, endless: 0, daily: { day: 99999999, streak: 1 }, log: ["x"] };
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.addInitScript(([k, v]) => localStorage.setItem(k, v), [SAVE_KEY, JSON.stringify(seed)]);
await p.goto("http://localhost:5178/", { waitUntil: "domcontentloaded", timeout: 20000 });
await p.waitForTimeout(3500);
await p.screenshot({ path: "/tmp/rv-medal.png" });
await b.close(); console.log("shot done");
