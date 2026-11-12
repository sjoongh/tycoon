import { describe, it, expect } from "vitest";
import { GameState } from "./GameState.js";
import { NATIONAL_TIERS, nationalReached, nationalRewardBetween, normalizeNational } from "../data/nationalGoal.js";

const fresh = () => {
  const gs = new GameState();
  gs.save = () => {};
  gs.seasonPts = 0;
  gs.addSeasonPoints = (n) => { gs.seasonPts += n; return []; }; // 시즌 단계 보상이 해명 합계를 흔들지 않게 분리
  gs.weeklyEvents(); // 주차 동기화
  return gs;
};
const addEvents = (gs, n) => { gs.data.stats.totalEvents += n; };

describe("전국 합산 목표(장기 #5)", () => {
  it("단계 도달 수와 구간 보상 합", () => {
    expect(nationalReached(0)).toBe(0);
    expect(nationalReached(299)).toBe(0);
    expect(nationalReached(300)).toBe(1);
    expect(nationalReached(1e9)).toBe(NATIONAL_TIERS.length);
    expect(nationalRewardBetween(0, 2)).toEqual({ explain: 180, seals: 0 });
    expect(nationalRewardBetween(2, 4)).toEqual({ explain: 500, seals: 3 });
  });

  it("이번 주 사건 수는 평생 사건 기준점에서 세고 감사(프레스티지) 후에도 이어진다", () => {
    const gs = fresh();
    addEvents(gs, 5);
    expect(gs.weeklyEvents()).toBe(5);
    gs.data.lifetime.totalEvents += gs.data.stats.totalEvents; // 리셋 시 foldLifetime과 같은 효과
    gs.data.stats.totalEvents = 0;
    expect(gs.weeklyEvents()).toBe(5);
  });

  it("baseEvents가 없던 세이브는 지금부터 센다", () => {
    const gs = fresh();
    const data = gs.normalize({ ...gs.data, stats: { ...gs.data.stats, totalEvents: 40 }, weekly: { week: gs._weekIndex(), baseVotes: 0, target: 1, claimed: false } }, Date.now());
    expect(data.weekly.baseEvents).toBe(40);
  });

  it("합산이 단계를 넘으면 자격자(3건 이상)만 받고, 같은 단계를 두 번 받지 않는다", () => {
    const gs = fresh();
    const wk = gs.data.national.week;
    gs.setNationalTotal(wk, 1200, 9);
    let st = gs.nationalState();
    expect(st).toMatchObject({ known: true, total: 1200, players: 9, reached: 2, eligible: false, claimable: false });
    expect(gs.claimNational()).toBe(null);
    addEvents(gs, 3);
    st = gs.nationalState();
    expect(st.claimable).toBe(true);
    const ex = gs.data.explain;
    expect(gs.claimNational()).toEqual({ explain: 180, seals: 0 });
    expect(gs.data.explain).toBe(ex + 180);
    expect(gs.claimNational()).toBe(null);
    expect(gs.seasonPts).toBe(40);
    gs.setNationalTotal(wk, 3500, 12);
    const seals = gs.data.prestige.seals;
    expect(gs.claimNational()).toEqual({ explain: 200, seals: 1 });
    expect(gs.data.prestige.seals).toBe(seals + 1);
  });

  it("단계를 새로 넘으면 한 번만 알린다", () => {
    const gs = fresh();
    const wk = gs.data.national.week;
    addEvents(gs, 3);
    const texts = [];
    gs.on("celebrate", (p) => texts.push(p.text));
    gs.setNationalTotal(wk, 400);
    gs.setNationalTotal(wk, 500);
    expect(texts).toEqual(["전국 목표 1단계 달성 · 랭킹에서 받기"]);
  });

  it("다른 주의 합산은 무시한다", () => {
    const gs = fresh();
    gs.setNationalTotal(gs.data.national.week + 1, 9999);
    expect(gs.nationalState().known).toBe(false);
  });

  it("주가 넘어가면 지난주 덜 받은 단계를 지난주 합산으로 정산한다", () => {
    const gs = fresh();
    const wk = gs._weekIndex();
    gs.data.weekly.week = wk - 1;
    gs.data.national = { week: wk - 1, claimed: 1, seen: 1, pending: null };
    gs.data.weekly.baseEvents = gs.lifetimeStat("totalEvents");
    addEvents(gs, 4);
    gs.weeklyEvents(); // 롤오버
    expect(gs.data.national).toMatchObject({ week: wk, claimed: 0, pending: { week: wk - 1, mine: 4, claimed: 1 } });
    expect(gs.weeklyEvents()).toBe(0);
    expect(gs.nationalPendingWeek()).toBe(wk - 1);
    const ex = gs.data.explain;
    gs.setNationalTotal(wk - 1, 3100);
    expect(gs.data.explain).toBe(ex + 120 + 200);
    expect(gs.data.national.pending).toBe(null);
    gs.setNationalTotal(wk - 1, 9000); // 두 번 정산하지 않는다
    expect(gs.data.explain).toBe(ex + 320);
  });

  it("지난주 사건이 3건 미만이면 정산 대상이 아니다", () => {
    const gs = fresh();
    const wk = gs._weekIndex();
    gs.data.weekly.week = wk - 1;
    gs.data.national = { week: wk - 1, claimed: 0, seen: 0, pending: null };
    gs.data.weekly.baseEvents = gs.lifetimeStat("totalEvents");
    addEvents(gs, 2);
    gs.weeklyEvents();
    expect(gs.data.national.pending).toBe(null);
  });

  it("감사 리셋에도 받은 단계와 주간 기준점이 유지된다", () => {
    const gs = fresh();
    addEvents(gs, 6);
    gs.setNationalTotal(gs.data.national.week, 1000);
    gs.claimNational();
    gs.data.stage.area = 6;
    gs.data.stats.totalVotes = 1e9;
    expect(gs.prestigeReset()).not.toBe(false);
    expect(gs.data.stats.totalEvents).toBe(0);
    expect(gs.data.national.claimed).toBe(2);
    expect(gs.weeklyEvents()).toBe(6);
  });

  it("손상된 상태를 정규화한다", () => {
    expect(normalizeNational({ week: "x", claimed: 99, seen: -1, pending: { week: 0 } })).toEqual({ week: 0, claimed: NATIONAL_TIERS.length, seen: 0, pending: null });
    expect(normalizeNational({ week: 5, pending: { week: 4, mine: 7.9, claimed: 1 } }).pending).toEqual({ week: 4, mine: 7, claimed: 1 });
  });
});
