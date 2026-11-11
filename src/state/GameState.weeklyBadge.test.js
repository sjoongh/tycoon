import { describe, it, expect } from "vitest";
import { GameState } from "./GameState.js";

describe("주간 랭킹 뱃지(단기 #6)", () => {
  it("등급: 1~3 엘리트, ~10 골드, 상위 50%(최소 20) 실버, 나머지 브론즈", () => {
    expect(GameState.badgeTierFor(1, 100)).toBe("elite");
    expect(GameState.badgeTierFor(3, 100)).toBe("elite");
    expect(GameState.badgeTierFor(10, 100)).toBe("gold");
    expect(GameState.badgeTierFor(20, 100)).toBe("silver");
    expect(GameState.badgeTierFor(50, 100)).toBe("silver");
    expect(GameState.badgeTierFor(51, 100)).toBe("bronze");
    expect(GameState.badgeTierFor(15, 12)).toBe("silver"); // 최소 20위까지 실버
    expect(GameState.badgeTierFor(0, 100)).toBe(null);
  });

  it("주가 바뀌면 지난주 순위로 뱃지를 확정하고 보상을 주며 최근 8개만 남긴다", () => {
    const gs = new GameState();
    const wk = gs._weekIndex();
    gs.data.weekly.week = wk - 1;
    gs.data.weeklyRank = { week: wk - 1, rank: 2, total: 30 };
    gs.data.badges = Array.from({ length: 8 }, (_, i) => ({ week: wk - 10 + i, tier: "bronze", rank: 30, total: 30 }));
    const explainBefore = gs.data.explain;
    const sealsBefore = gs.data.prestige.seals || 0;
    let got = null;
    gs.on("weekly-badge", (b) => { got = b; });
    gs.weeklyProgress(); // _ensureWeekly → 롤오버
    expect(got?.tier).toBe("elite");
    expect(gs.data.badges.length).toBe(8);
    expect(gs.data.badges[gs.data.badges.length - 1]).toMatchObject({ week: wk - 1, tier: "elite", rank: 2 });
    expect(gs.data.explain).toBe(explainBefore + 300);
    expect(gs.data.prestige.seals).toBe(sealsBefore + 2);
    expect(gs.data.weeklyRank).toEqual({ week: wk, rank: 0, total: 0 });
    expect(gs.takePendingBadge()?.tier).toBe("elite");
    expect(gs.takePendingBadge()).toBe(null);
  });

  it("순위 기록이 없으면 롤오버해도 뱃지를 만들지 않는다", () => {
    const gs = new GameState();
    const wk = gs._weekIndex();
    gs.data.weekly.week = wk - 1;
    gs.weeklyProgress();
    expect(gs.data.badges).toEqual([]);
  });

  it("마일스톤을 지나는 업그레이드는 milestone 이벤트를 낸다", () => {
    const gs = new GameState();
    gs.data.tutorial.done = true;
    gs.data.votes = 1e12; gs.data.explain = 1e9;
    gs.data.facilities.desk = 9;
    const hits = [];
    gs.on("milestone", (p) => hits.push(p.level));
    gs.bulkUpgrade("desk", 1);
    expect(hits).toEqual([10]);
    gs.bulkUpgrade("desk", 10); // 10 → 20
    expect(hits).toEqual([10, 20]);
  });
});

describe("인장 공식(중기 #3)", () => {
  it("이번 런 처리 표가 많을수록 인장이 늘고(√), 1시간 미리보기는 지금보다 크거나 같다", () => {
    const gs = new GameState();
    gs.data.stage.area = 6;
    gs.data.prestige.bestArea = 6;
    gs.data.facilities.desk = 30;
    gs.data.stats.totalVotes = 44000 * 4;
    const a = gs.prestigePreview();
    gs.data.stats.totalVotes = 44000 * 16;
    const b = gs.prestigePreview();
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    const pj = gs.prestigeProjection();
    expect(pj.earnedIn1h).toBeGreaterThanOrEqual(pj.earned);
  });
});
