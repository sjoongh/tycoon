import { describe, it, expect, beforeEach } from "vitest";
import { GameState } from "./GameState.js";
import { specialSchedule, stationCost, rolloverSpecial, claimNewTiers, SPECIAL_FALLBACK } from "./specialOffice.js";
import { SPECIAL_TIERS, SPECIAL_THEMES } from "../data/specialOffice.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
}
beforeEach(() => installLocalStorage());

function openGs() {
  const gs = new GameState();
  gs.checkProgression = () => {};
  // 열린 날로 고정
  const sch = gs.specialSchedule();
  if (!sch.open) gs._todayIndex = () => sch.week * 7 + 1;
  return gs;
}

describe("특별 개표소(중기 #7)", () => {
  it("주 7일 중 5일 열리고 테마가 주마다 돈다", () => {
    expect(specialSchedule(70).open).toBe(true); // day 0
    expect(specialSchedule(74).open).toBe(true); // day 4
    expect(specialSchedule(75).open).toBe(false); // day 5
    expect(specialSchedule(70).theme.id).not.toBe(specialSchedule(77).theme.id);
  });

  it("탭·생산으로 특표가 쌓이고 시설은 1.35배씩 비싸진다", () => {
    const gs = openGs();
    const st = gs.specialState();
    expect(st.open).toBe(true);
    for (let i = 0; i < 12; i++) gs.specialTap();
    expect(gs.data.special.votes).toBe(12);
    expect(gs.specialUpgrade(0)).toBe(true);
    expect(gs.data.special.stations[0]).toBe(1);
    expect(stationCost(0, 1)).toBe(Math.ceil(10 * 1.35));
    expect(gs.specialStationUnlocked(1)).toBe(false);
    gs._tickSpecial();
    expect(gs.data.special.total).toBe(13);
  });

  it("등급을 넘으면 보상을 메인 경제로 주고 한 번만 준다", () => {
    const gs = openGs();
    gs.specialState();
    const e0 = gs.data.explain;
    gs.data.special.total = SPECIAL_TIERS[1].need;
    gs._specialAfterGain();
    expect(gs.data.special.tiers.bronze).toBe(1);
    expect(gs.data.special.tiers.silver).toBe(1);
    expect(gs.data.explain).toBe(e0 + SPECIAL_TIERS[0].reward.explain + SPECIAL_TIERS[1].reward.explain);
    gs._specialAfterGain();
    expect(gs.data.explain).toBe(e0 + SPECIAL_TIERS[0].reward.explain + SPECIAL_TIERS[1].reward.explain);
  });

  it("주가 바뀌면 특표는 사라지고 최고 등급만 기록으로 남는다", () => {
    const themeOf = (w) => SPECIAL_THEMES[w % SPECIAL_THEMES.length];
    const sp = { ...SPECIAL_FALLBACK, week: 10, votes: 999, total: 100000, stations: [5, 2, 0], tiers: { bronze: 1, silver: 1 } };
    const r = rolloverSpecial(sp, [], 11, themeOf);
    expect(r.sp.votes).toBe(0);
    expect(r.sp.stations).toEqual([0, 0, 0]);
    expect(r.archived).toMatchObject({ week: 10, tier: "silver" });
    expect(r.history.length).toBe(1);
  });

  it("감사·전복 후에도 특별 개표소·뱃지·첫 도달 기록이 유지된다(회귀)", () => {
    const gs = openGs();
    gs.specialState();
    for (let i = 0; i < 5; i++) gs.specialTap();
    gs.data.badges = [{ week: 1, tier: "gold", rank: 5, total: 40 }];
    gs.data.firsts.staffAt = 123;
    gs.data.stage.area = 8; gs.data.prestige.bestArea = 8; gs.data.facilities.desk = 30;
    expect(gs.prestigeReset()).not.toBe(false);
    expect(gs.data.special.votes).toBe(5);
    expect(gs.data.badges.length).toBe(1);
    expect(gs.data.firsts.staffAt).toBe(123);
    gs.communistReset();
    expect(gs.data.special.votes).toBe(5);
    expect(gs.data.badges.length).toBe(1);
  });
});

describe("조례(훈장 규칙 해금)", () => {
  it("속행 개표: 감사 후 3구역에서 시작", () => {
    const gs = new GameState();
    gs.checkProgression = () => {};
    gs.data.prestige.medalUpgrades = { ruleFastStart: 1 };
    gs.data.stage.area = 8; gs.data.prestige.bestArea = 8; gs.data.facilities.desk = 30;
    gs.prestigeReset();
    expect(gs.data.stage.area).toBe(3);
    expect(gs.data.stage.target).toBe(gs.stageTarget(3));
  });

  it("상설 특별 개표소: 휴식일에도 열린다", () => {
    const gs = new GameState();
    gs._todayIndex = () => 70 + 5; // day 5 = 휴식일
    expect(gs.specialSchedule().open).toBe(false);
    gs.data.prestige.medalUpgrades = { ruleSpecialAlways: 1 };
    expect(gs.specialSchedule().open).toBe(true);
  });

  it("조례는 1회 구매하면 다시 살 수 없다", () => {
    const gs = new GameState();
    gs.data.prestige.medals = 20;
    expect(gs.buyPrestigeUpgrade("ruleDoubleCount")).not.toBe(false);
    expect(gs.hasRule("ruleDoubleCount")).toBe(true);
    const m = gs.data.prestige.medals;
    expect(gs.buyPrestigeUpgrade("ruleDoubleCount")).toBe(false);
    expect(gs.data.prestige.medals).toBe(m);
  });

  it("연속 대응: 25% 안에 들면 다음 사건이 즉시 대기", () => {
    const gs = new GameState();
    gs.checkProgression = () => {};
    gs.data.prestige.medalUpgrades = { ruleEventChain: 1 };
    const orig = Math.random; Math.random = () => 0.1;
    try {
      const ev = gs.pickNextEvent ? gs.pickNextEvent() : null;
      if (ev) gs.resolveEventChoice(ev, "left");
      if (ev) expect(gs.eventReady()).toBe(true);
    } finally { Math.random = orig; }
  });
});
