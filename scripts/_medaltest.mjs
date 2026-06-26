import { chromium } from "playwright";
const SAVE_KEY = "trust-office-phaser-v2"; const now = Date.now();
// 훈장(2차 통화) 검증 시드: area 8, 아직 훈장 미적립(medalBest 기본 4 → preview 4 기대), 인장은 충분
const seed = { version: 3, votes: 1e9, explain: 1e6, trust: 80, days: 6, paused: false, selected: "desk", activeTab: "prestige",
  tutorial: { step: 5, done: true }, lastSavedAt: now, lastSeenAt: now,
  facilities: { desk: 20, sorter: 12, notice: 8, server: 6, archive: 5, studio: 3 }, staff: { clerk: 3, auditor: 2, engineer: 1, speaker: 1 },
  stage: { area: 8, progress: 200, target: 99999, completed: 7 },
  prestige: { seals: 50, runs: 2, bestArea: 8, totalSeals: 60, upgrades: { audit: 5 } },
  stats: { totalVotes: 5e8, totalClicks: 50, totalUpgrades: 30, totalEvents: 40, totalOfflineMs: 0 },
  achievements: {}, quests: {}, endless: 0, daily: { day: 99999999, streak: 1 }, log: ["x"] };
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.addInitScript(([k, v]) => localStorage.setItem(k, v), [SAVE_KEY, JSON.stringify(seed)]);
const errs = []; p.on("pageerror", e => errs.push("PE:" + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("CE:" + m.text()); });
await p.goto("http://localhost:5178/", { waitUntil: "domcontentloaded", timeout: 20000 });
for (let i = 0; i < 40; i++) { const ok = await p.evaluate(() => { try { const s = window.__game && window.__game.scene.getScene("GameScene"); return !!(s && s.scene.isActive()); } catch { return false; } }); if (ok) break; await p.waitForTimeout(300); }
await p.waitForTimeout(600);

const r = await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  const out = {};
  // 1) 적립 공식: area 8 - medalBest 4 = 4
  out.medalPreviewBefore = gs.medalPreview();
  // 2) 인장 트리 미해금 시 grid 버튼 수(인장 9개) + 훈장 미해금이라 grid 없음(안내만)
  out.sealButtons = document.querySelectorAll(".gp-sealgrid .gp-seal:not(.gp-seal--medal)").length;
  out.medalButtonsLocked = document.querySelectorAll(".gp-seal--medal").length;
  // 3) 감사 실행 → 훈장 적립 검증
  const before = { medals: gs.data.prestige.medals, medalBest: gs.data.prestige.medalBest, runs: gs.data.prestige.runs };
  gs.prestigeReset();
  out.afterMedals = gs.data.prestige.medals;          // 0 + 4
  out.afterMedalBest = gs.data.prestige.medalBest;    // max(4,8)=8
  out.afterTotalMedals = gs.data.prestige.totalMedals;
  out.afterRuns = gs.data.prestige.runs;
  out.startVotesNoLegacy = gs.data.votes;             // base only
  // 4) 재감사 시 적립 0(같은 구역, 깊이 안 밀면 못 캠 — 스팸 방지)
  gs.data.stage.area = 8; out.medalPreviewSameArea = gs.medalPreview(); // 8-8=0
  gs.data.stage.area = 11; out.medalPreviewDeeper = gs.medalPreview();  // 11-8=3
  return out;
});

// 효과 검증: 훈장 업그레이드를 직접 주입하고 곱연산/메타/상한 반영 확인
const fx = await p.evaluate(() => {
  const gs = window.__game.registry.get("gameState");
  const d = gs.data.prestige;
  d.medals = 999;
  const base = {
    sealMult0: gs.permanentEffectFor(gs.data, "sealMult"),
    runsMult0: gs.permanentEffectFor(gs.data, "runsMult"),
    capBoost0: Math.round(gs.permanentEffectFor(gs.data, "capBoost")),
    manualMax0: gs.effectiveMaxLevel({ id: "manual", maxLevel: 15 }),
    multBefore: gs.prestigeMultiplierFor(gs.data),
    previewBefore: gs.prestigePreview(),
  };
  // decree Lv5(sealMult .60), tenure Lv4(runsMult .60), archive Lv3(capBoost 6), legacy Lv2(startVotes +2400)
  d.medalUpgrades = { decree: 5, tenure: 4, archive: 3, legacy: 2, eternal: 0 };
  const after = {
    sealMult: gs.permanentEffectFor(gs.data, "sealMult"),
    runsMult: gs.permanentEffectFor(gs.data, "runsMult"),
    capBoost: Math.round(gs.permanentEffectFor(gs.data, "capBoost")),
    manualMax: gs.effectiveMaxLevel({ id: "manual", maxLevel: 15, currency: undefined }),
    multAfter: gs.prestigeMultiplierFor(gs.data),
    previewAfter: gs.prestigePreview(),
    startVotesWithLegacy: gs.startingVotesFor({ runs: 0, medalUpgrades: d.medalUpgrades }),
  };
  // 구매 경로(통화 차감) 검증: eternal 1레벨 구매
  const medalsB = d.medals; const okBuy = gs.buyPrestigeUpgrade("eternal");
  return { ...base, ...after, buyOk: okBuy, medalsSpent: medalsB - d.medals, eternalLv: d.medalUpgrades.eternal };
});

console.log("EARN", JSON.stringify(r));
console.log("FX", JSON.stringify(fx));
console.log(errs.length ? "ERRORS:\n" + errs.slice(0, 12).join("\n") : "NO CONSOLE ERRORS");
await b.close();
