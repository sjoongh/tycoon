import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GameState } from "./GameState.js";
import { clock } from "./clock.js";
import {
  SEASON_THEMES, SEASON_TRACK, SEASON_POINTS, SEASON_HISTORY_MAX,
  seasonKeyFor, seasonMonthOf, seasonThemeFor, seasonDaysLeft, seasonStepsReached, seasonStepReward, normalizeSeason, rolloverSeason,
} from "../data/seasons.js";
import { govTitles, gachaTitles, titleById } from "../data/titles.js";
import { cosmeticById } from "../data/cosmetics.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
}
beforeEach(() => installLocalStorage());
afterEach(() => clock.reset());

// 로컬 시각 기준으로 특정 연·월(0-based)·일로 시계를 맞춘다.
function setDate(y, m, d = 15) {
  clock.setOffset(new Date(y, m, d, 12).getTime() - Date.now());
}

function newGs() {
  const gs = new GameState();
  gs.checkProgression = () => {};
  return gs;
}

describe("월간 시즌 데이터", () => {
  it("월 키·월·테마가 달마다 돈다", () => {
    const nov = seasonKeyFor(new Date(2026, 10, 3).getTime());
    expect(seasonMonthOf(nov)).toBe(11);
    expect(seasonKeyFor(new Date(2026, 11, 31).getTime())).toBe(nov + 1);
    expect(seasonThemeFor(nov).id).not.toBe(seasonThemeFor(nov + 1).id);
    expect(seasonThemeFor(nov).id).toBe(seasonThemeFor(nov + SEASON_THEMES.length).id);
  });

  it("모든 테마는 가상 선거이고 한정 모자·시즌 발령이 실제로 있다", () => {
    for (const t of SEASON_THEMES) {
      expect(t.name).toContain("가상 선거");
      const hat = cosmeticById(t.hat);
      expect(hat?.slot).toBe("hat");
      expect(hat?.unlock?.type).toBe("season");
      expect(hat?.img).toMatch(/^\/art\/world\/cos-s-.+-icon\.webp$/);
      const title = titleById(t.title);
      expect(title?.rarity).toBe("season");
      expect(title?.weight).toBe(0);
    }
  });

  it("남은 일수는 오늘 포함, 말일엔 1", () => {
    expect(seasonDaysLeft(new Date(2026, 10, 30, 23).getTime())).toBe(1);
    expect(seasonDaysLeft(new Date(2026, 10, 1).getTime())).toBe(30);
  });

  it("트랙은 오름차순이고 모자·발령이 한 칸씩 있다", () => {
    for (let i = 1; i < SEASON_TRACK.length; i += 1) expect(SEASON_TRACK[i].need).toBeGreaterThan(SEASON_TRACK[i - 1].need);
    expect(SEASON_TRACK.filter((s) => s.kind === "hat")).toHaveLength(1);
    expect(SEASON_TRACK.filter((s) => s.kind === "title")).toHaveLength(1);
    expect(seasonStepsReached(0)).toBe(0);
    expect(seasonStepsReached(SEASON_TRACK[2].need)).toBe(3);
    expect(seasonStepsReached(99999)).toBe(SEASON_TRACK.length);
    expect(seasonStepReward(SEASON_TRACK.length, SEASON_THEMES[0])).toBeNull();
  });

  it("잘못된 저장 값을 정리하고, 달이 바뀌면 진행이 있던 시즌만 기록한다", () => {
    expect(normalizeSeason({ key: "x", points: -5, steps: 99, history: [null, 3] })).toEqual({ key: 0, points: 0, steps: SEASON_TRACK.length, history: [] });
    const fresh = rolloverSeason({ key: 0 }, 100);
    expect(fresh.archived).toBeNull();
    expect(fresh.season.key).toBe(100);
    const empty = rolloverSeason({ key: 100, points: 0, steps: 0 }, 101);
    expect(empty.archived).toBeNull();
    const r = rolloverSeason({ key: 100, points: 200, steps: 3 }, 101);
    expect(r.archived).toEqual({ key: 100, theme: seasonThemeFor(100).id, points: 200, steps: 3 });
    expect(r.season).toMatchObject({ key: 101, points: 0, steps: 0 });
    let s = { key: 1, points: 1, steps: 0, history: [] };
    for (let k = 2; k < 12; k += 1) s = rolloverSeason(s, k).season, s.points = 1;
    expect(s.history).toHaveLength(SEASON_HISTORY_MAX);
  });
});

describe("월간 시즌 진행(GameState)", () => {
  it("도달한 단계 보상을 즉시 지급한다", () => {
    setDate(2026, 10);
    const gs = newGs();
    const e0 = gs.data.explain;
    const s0 = gs.data.prestige.seals;
    gs.addSeasonPoints(SEASON_TRACK[1].need);
    const st = gs.seasonState();
    expect(st.steps).toBe(2);
    expect(st.month).toBe(11);
    expect(gs.data.explain).toBe(e0 + SEASON_TRACK[0].reward.explain);
    expect(gs.data.prestige.seals).toBe(s0 + SEASON_TRACK[1].reward.seals);
    gs.addSeasonPoints(1);
    expect(gs.seasonState().steps).toBe(2);
  });

  it("한정 모자는 보유·장착되고, 시즌 발령은 장착되며 재방문 땐 레벨업한다", () => {
    setDate(2026, 10);
    const gs = newGs();
    const theme = gs.seasonState().theme;
    gs.addSeasonPoints(SEASON_TRACK[SEASON_TRACK.length - 1].need);
    expect(gs.ownsCosmetic(theme.hat)).toBe(true);
    expect(gs.equippedCosmetic("hat")).toBe(theme.hat);
    expect(gs.data.titles[theme.title]).toBe(1);
    expect(gs.data.equippedTitle).toBe(theme.title);
    // 6개월 뒤 같은 테마
    setDate(2027, 4);
    expect(gs.seasonState().theme.id).toBe(theme.id);
    expect(gs.seasonState().points).toBe(0);
    gs.addSeasonPoints(SEASON_TRACK[SEASON_TRACK.length - 1].need);
    expect(gs.data.titles[theme.title]).toBe(2);
  });

  it("달이 바뀌면 지난 시즌을 기록하고 0에서 시작한다", () => {
    setDate(2026, 10);
    const gs = newGs();
    gs.addSeasonPoints(SEASON_TRACK[2].need);
    const events = [];
    gs.on("season-archived", (e) => events.push(e));
    setDate(2026, 11, 1);
    const st = gs.seasonState();
    expect(st.points).toBe(0);
    expect(st.history.at(-1)).toMatchObject({ steps: 3, points: SEASON_TRACK[2].need });
    expect(events).toHaveLength(1);
  });

  it("일일 퀘스트·주간 목표 수령 때 포인트가 쌓인다", () => {
    setDate(2026, 10);
    const gs = newGs();
    gs.dailyQuestClaimable = () => true;
    const id = Object.keys(gs.data.daily?.claimed || {})[0] || gs.dailyQuestDefs()[0].id;
    gs.claimDailyQuest(id);
    expect(gs.seasonState().points).toBe(SEASON_POINTS.daily);
    gs.clockSuspicious = () => false;
    gs.weeklyClaimable = () => true;
    gs.claimWeekly();
    expect(gs.seasonState().points).toBe(SEASON_POINTS.daily + SEASON_POINTS.weekly);
  });

  it("시즌 진행은 감사(리셋)에도 유지된다", () => {
    setDate(2026, 10);
    const gs = newGs();
    gs.addSeasonPoints(100);
    gs.prestigePreview = () => 1;
    gs.medalPreview = () => 0;
    gs.prestigeReset();
    expect(gs.seasonState().points).toBe(100);
  });

  it("저장 후 다시 불러와도 시즌이 남는다", () => {
    setDate(2026, 10);
    const gs = newGs();
    gs.addSeasonPoints(90);
    gs.save(false);
    const gs2 = newGs();
    expect(gs2.seasonState()).toMatchObject({ points: 90, steps: 2 });
  });
});

describe("시즌 발령과 뽑기", () => {
  it("뽑기 풀에 시즌 발령이 없다", () => {
    expect(gachaTitles.length).toBe(govTitles.length - SEASON_THEMES.length);
    expect(gachaTitles.some((t) => t.rarity === "season")).toBe(false);
    const gs = newGs();
    const orig = Math.random;
    try {
      for (const v of [0, 0.25, 0.5, 0.75, 0.9999]) {
        Math.random = () => v;
        expect(gs._pickGachaTitle().rarity).not.toBe("season");
      }
    } finally {
      Math.random = orig;
    }
  });

  it("시즌 발령은 보유 칭호 수(전수집)에 들어가지 않는다", () => {
    const gs = newGs();
    gs.data.titles = { "s-press": 1 };
    expect(gs.ownedTitleCount()).toBe(0);
  });
});
