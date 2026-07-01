import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomItems, pickRandomItem } from "../src/data/items.js";
import { achievementDefinitions } from "../src/data/achievements.js";
import { dailyQuestDefinitions } from "../src/data/dailyQuests.js";
import { weeklyGoalDefinitions } from "../src/data/weeklyGoals.js";

describe("게임 데이터 무결성", () => {
  it("randomItems는 고유 id, pickRandomItem은 풀 안의 아이템을 반환", () => {
    const ids = randomItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 0; i < 20; i++) expect(randomItems).toContain(pickRandomItem());
  });

  it("모든 randomItem은 applyRandomItem에 보상 핸들러(case)를 갖는다", () => {
    const src = readFileSync(fileURLToPath(new URL("../src/state/GameState.js", import.meta.url)), "utf8");
    const cases = new Set([...src.matchAll(/case "(\w+)":/g)].map((m) => m[1]));
    for (const it of randomItems) expect(cases.has(it.id)).toBe(true);
  });

  it("업적은 고유 id + 양수 target + metric 문자열", () => {
    const ids = achievementDefinitions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of achievementDefinitions) {
      expect(a.target).toBeGreaterThan(0);
      expect(typeof a.metric).toBe("string");
    }
  });

  it("전종 수집 업적(dex69) target은 실제 사건 수와 일치한다", async () => {
    const { officeEvents } = await import("../src/data/events.js");
    const full = achievementDefinitions.find((a) => a.id === "dex69");
    expect(full).toBeTruthy();
    expect(full.metric).toBe("dexSeen");
    expect(full.target).toBe(officeEvents.length);
  });

  it("칭호 전수집 업적(titlesAll) target은 실제 칭호 수와 일치한다", async () => {
    const { govTitles } = await import("../src/data/titles.js");
    const full = achievementDefinitions.find((a) => a.id === "titlesAll");
    expect(full).toBeTruthy();
    expect(full.metric).toBe("titlesOwned");
    expect(full.target).toBe(govTitles.length);
    // 칭호 가중치 합 = 100(가중 추첨 일관성)
    expect(govTitles.reduce((s, t) => s + (t.weight || 0), 0)).toBe(100);
  });

  it("모든 일일 퀘스트 metric은 자정 리셋(_ensureDailyQuests)에서 0으로 초기화된다", () => {
    // 리셋 누락 시 stale 카운트로 데일리가 매일 자동완료되는 버그(R45 items 사례) 방지 가드.
    const src = readFileSync(fileURLToPath(new URL("../src/state/GameState.js", import.meta.url)), "utf8");
    const resetBlock = src.slice(src.indexOf("_ensureDailyQuests() {"), src.indexOf("dailyQuestProgress"));
    for (const q of dailyQuestDefinitions) {
      expect(resetBlock).toMatch(new RegExp(`daily\\.${q.metric}\\s*=\\s*0`));
    }
  });

  it("외신 반응(worldPress)은 4티어 모두 있고 각 항목이 outlet+text를 갖는다", async () => {
    const { worldPress, pickPress } = await import("../src/data/worldPress.js");
    for (const tier of ["praise", "neutral", "mock", "collapse"]) {
      expect(Array.isArray(worldPress[tier])).toBe(true);
      expect(worldPress[tier].length).toBeGreaterThan(0);
      for (const h of worldPress[tier]) {
        expect(typeof h.outlet).toBe("string");
        expect(typeof h.text).toBe("string");
      }
    }
    // pickPress: 티어별 tone 반환 + 전복 게이지 우선
    expect(pickPress("bonus", 0).tone).toBe("praise");
    expect(pickPress("crisis", 0).tone).toBe("mock");
    expect(pickPress("normal", 0).tone).toBe("neutral");
    expect(pickPress("bonus", 0.5).tone).toBe("mock"); // 전복 게이지 우선(collapse pool)
  });

  it("외신 반응에 실존 국가·언론사·인물 지목이 없다(법적 안전)", async () => {
    const { worldPress } = await import("../src/data/worldPress.js");
    const risky = /북한|중국|일본|미국|러시아|노동신문|조선중앙|신화통신|CNN|BBC|로이터|연합뉴스|대통령|위원장/;
    const all = Object.values(worldPress).flat().map((h) => `${h.outlet} ${h.text}`).join(" ");
    expect(risky.test(all)).toBe(false);
  });

  it("데일리/주간 목표는 고유 id", () => {
    const d = dailyQuestDefinitions.map((x) => x.id);
    expect(new Set(d).size).toBe(d.length);
    const w = weeklyGoalDefinitions.map((x) => x.id);
    expect(new Set(w).size).toBe(w.length);
  });
});
