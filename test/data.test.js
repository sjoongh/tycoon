import { describe, it, expect } from "vitest";
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

  it("업적은 고유 id + 양수 target + metric 문자열", () => {
    const ids = achievementDefinitions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of achievementDefinitions) {
      expect(a.target).toBeGreaterThan(0);
      expect(typeof a.metric).toBe("string");
    }
  });

  it("데일리/주간 목표는 고유 id", () => {
    const d = dailyQuestDefinitions.map((x) => x.id);
    expect(new Set(d).size).toBe(d.length);
    const w = weeklyGoalDefinitions.map((x) => x.id);
    expect(new Set(w).size).toBe(w.length);
  });
});
