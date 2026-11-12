import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GameState } from "./GameState.js";
import { clock } from "./clock.js";
import { headlines, headlineById, normalizeHeadlines, headlineBonusFor, HEADLINE_MILESTONES, HEADLINE_TRIGGERS, HEADLINE_CHECK_TICKS } from "../data/headlines.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
}
beforeEach(() => installLocalStorage());
afterEach(() => clock.reset());

function newGs() {
  const gs = new GameState();
  gs.checkProgression = () => {};
  return gs;
}

// 로컬 시각 기준 고정 시점(평일 화요일 오후 3시 — clock 헤드라인이 하나도 안 걸리는 시각)
const at = (y, m, d, h = 15) => new Date(y, m - 1, d, h, 10).getTime();
const QUIET = at(2026, 11, 10);

describe("헤드라인 데이터", () => {
  it("id 가 겹치지 않고, 모든 칸에 매체·문구·조건 힌트가 있다", () => {
    expect(new Set(headlines.map((h) => h.id)).size).toBe(headlines.length);
    for (const h of headlines) {
      expect(h.id.startsWith("hl-")).toBe(true);
      expect(h.outlet && h.text && h.hint).toBeTruthy();
      expect(typeof h.test).toBe("function");
    }
    expect(HEADLINE_TRIGGERS).not.toContain("clock");
  });

  it("잘못된 저장 값을 정리한다", () => {
    expect(normalizeHeadlines({ "hl-dawn": 123, "hl-lunch": "x", nope: 5 })).toEqual({ "hl-dawn": 123, "hl-lunch": 1 });
    expect(normalizeHeadlines(null)).toEqual({});
  });
});

describe("헤드라인 판정", () => {
  it("조용한 평일 오후에는 clock 헤드라인이 없다", () => {
    const gs = newGs();
    expect(gs.checkHeadlines("clock", {}, QUIET)).toBeNull();
    expect(gs.headlineCount()).toBe(0);
  });

  it("시각·날짜 조건: 새벽·점심·주말·만우절", () => {
    const gs = newGs();
    expect(gs.checkHeadlines("clock", {}, at(2026, 11, 10, 3)).id).toBe("hl-dawn");
    expect(gs.checkHeadlines("clock", {}, at(2026, 11, 10, 12)).id).toBe("hl-lunch");
    expect(gs.checkHeadlines("clock", {}, at(2026, 11, 14)).id).toBe("hl-weekend"); // 토요일
    expect(gs.checkHeadlines("clock", {}, at(2027, 4, 1)).id).toBe("hl-aprilfool");
  });

  it("한 번 스크랩한 헤드라인은 다시 뜨지 않고, 한 번에 하나씩만 스크랩한다", () => {
    const gs = newGs();
    const sat3am = at(2026, 11, 14, 3); // 새벽 + 주말 동시
    const a = gs.checkHeadlines("clock", {}, sat3am);
    const b = gs.checkHeadlines("clock", {}, sat3am);
    expect([a.id, b.id].sort()).toEqual(["hl-dawn", "hl-weekend"]);
    expect(gs.checkHeadlines("clock", {}, sat3am)).toBeNull();
    expect(gs.headlineCount()).toBe(2);
  });

  it("스크랩하면 headline 이벤트를 내고, 표·로그는 건드리지 않는다", () => {
    const gs = newGs();
    const seen = [];
    gs.on("headline", (p) => seen.push(p));
    const v0 = gs.data.votes;
    const log0 = [...gs.data.log];
    const r = gs.checkHeadlines("clock", {}, at(2026, 11, 10, 0));
    expect(r.id).toBe("hl-midnight");
    expect(gs.data.votes).toBe(v0);
    expect(gs.data.log).toEqual(log0);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ id: "hl-midnight", count: 1, total: headlines.length, milestone: null });
  });

  it("스크랩 수에 따라 생산 보너스가 붙고, 마지막 단계는 전부 수집이다", () => {
    expect(HEADLINE_MILESTONES.at(-1).n).toBe(headlines.length);
    expect(headlineBonusFor(4)).toBe(0);
    expect(headlineBonusFor(5)).toBe(0.02);
    expect(headlineBonusFor(headlines.length)).toBe(0.1);
    const gs = newGs();
    const cps0 = gs.cpsFor(gs.data);
    const ids = headlines.slice(0, 4).map((h) => h.id);
    ids.forEach((id) => { gs.data.headlines[id] = 1; });
    expect(gs.nextHeadlineMilestone().n).toBe(5);
    gs.data.trust = 100;
    const before = gs.cpsFor(gs.data);
    const r = gs.checkHeadlines("clock", {}, QUIET); // 5번째 = 믿음 100%
    expect(r.milestone).toMatchObject({ n: 5 });
    expect(gs.cpsFor(gs.data) / before).toBeCloseTo(1.02, 5);
    expect(cps0).toBeGreaterThan(0);
  });

  it("상태 조건: 믿음 100%·적체 5분분·8시간 부재", () => {
    const gs = newGs();
    gs.data.trust = 100;
    expect(gs.checkHeadlines("clock", {}, QUIET).id).toBe("hl-trust100");
    gs.data.backlog = gs.capacityFor(gs.data) * 301;
    expect(gs.checkHeadlines("clock", {}, QUIET).id).toBe("hl-backlog");
    gs._sessionOfflineMs = 8 * 3600000;
    expect(gs.checkHeadlines("clock", {}, QUIET).id).toBe("hl-away");
  });

  it("게임 이벤트가 나면 해당 헤드라인을 바로 판정한다", () => {
    const gs = newGs();
    gs.data.stats.ciders = 4;
    gs.emit("cider", { bonus: 1 });
    expect(gs.data.headlines["hl-cider"]).toBeUndefined();
    gs.data.stats.ciders = 5;
    gs.emit("cider", { bonus: 1 });
    expect(gs.data.headlines["hl-cider"]).toBeGreaterThan(0);
    gs.emit("boss-end", { success: false });
    expect(gs.data.headlines["hl-boss"]).toBeUndefined();
    gs.emit("boss-end", { success: true });
    expect(gs.data.headlines["hl-boss"]).toBeGreaterThan(0);
    gs.emit("special-tier", { id: "gold" });
    gs.emit("special-tier", { id: "elite" });
    expect(Object.keys(gs.data.headlines)).toContain("hl-elite");
  });

  it("tick 이 판정 주기마다 clock 판정을 부른다", () => {
    const gs = newGs();
    const calls = [];
    gs.checkHeadlines = (t) => calls.push(t);
    for (let i = 0; i < HEADLINE_CHECK_TICKS * 2; i += 1) gs.tick();
    expect(calls.filter((t) => t === "clock")).toHaveLength(2);
  });

  it("이삿짐 마지막 상자를 풀면 집들이 헤드라인", () => {
    const gs = newGs();
    gs.data.stage.moveBoxes = 1;
    gs.openMoveBox();
    expect(gs.data.headlines["hl-move"]).toBeGreaterThan(0);
  });
});

describe("헤드라인 스크랩 유지", () => {
  it("감사·재로드 후에도 남는다", () => {
    const gs = newGs();
    gs.checkHeadlines("clock", {}, at(2026, 11, 10, 3));
    gs.prestigePreview = () => 1;
    gs.medalPreview = () => 0;
    gs.prestigeReset();
    expect(gs.data.headlines["hl-dawn"]).toBeGreaterThan(0);
    expect(gs.data.headlines["hl-prestige"]).toBeGreaterThan(0); // 감사 완료 헤드라인도 함께
    gs.save(false);
    const gs2 = newGs();
    expect(gs2.headlineCount()).toBe(2);
    expect(headlineById("hl-prestige")).toBeTruthy();
  });
});
