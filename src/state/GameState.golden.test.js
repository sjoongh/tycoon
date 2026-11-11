import { describe, it, expect, beforeEach } from "vitest";
import { GameState } from "./GameState.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
}
beforeEach(() => installLocalStorage());

function ready() {
  const gs = new GameState();
  gs.data.tutorial.done = true;
  gs.data.facilities.desk = 20; gs.data.facilities.sorter = 20; gs.data.facilities.archive = 10;
  gs.data.votes = 1e6;
  gs.checkProgression = () => {};
  return gs;
}

describe("골든 이벤트(중기 #5)", () => {
  it("분포: 특보(<0.4) 생산 ×7 77초, 후원금(<0.8), 국장 담화(<0.95), 탭 광풍", () => {
    const gs = ready();
    const base = gs.cps();
    expect(gs.rollGoldenEvent(1, { rand: 0.1 }).kind).toBe("breaking");
    expect(gs.cps()).toBeCloseTo(base * 7, 3);
    expect(gs.goldenBuffRemainingMs()).toBeGreaterThan(70000);
    const v0 = gs.data.votes;
    const d = gs.rollGoldenEvent(1, { rand: 0.5 });
    expect(d.kind).toBe("donation");
    expect(gs.data.votes - v0).toBeCloseTo(d.amount, 3);
    expect(d.amount).toBeLessThanOrEqual(Math.max(50, v0 * 0.15 + 13) * 1.0001 * 10);
    const t0 = gs.data.trust;
    expect(gs.rollGoldenEvent(1, { rand: 0.9 }).kind).toBe("address");
    expect(gs.data.trust).toBeGreaterThanOrEqual(Math.min(100, t0));
    const c0 = gs.goldenClickMultiplier();
    expect(gs.rollGoldenEvent(1, { rand: 0.99 }).kind).toBe("frenzy");
    expect(gs.goldenClickMultiplier()).toBe(20);
    expect(c0).toBe(1);
  });

  it("보상 슬롯 증폭: 후원금은 2배 더(총 3배), 특보는 시간 2배", () => {
    const gs = ready();
    const d = gs.rollGoldenEvent(1, { rand: 0.5 });
    const v = gs.data.votes;
    gs.amplifyGolden(d);
    expect(gs.data.votes - v).toBeCloseTo(d.amount * 2, 3);
    const b = gs.rollGoldenEvent(1, { rand: 0.1 });
    const until = gs.data.buffs.prodUntil;
    gs.amplifyGolden(b);
    expect(gs.data.buffs.prodUntil - until).toBeGreaterThanOrEqual(b.ms - 5);
  });

  it("생산 2배 부스트는 중첩되지 않는다", () => {
    const gs = ready();
    const base = gs.cps();
    expect(gs.activateBoost(4)).toBe(true);
    expect(gs.cps()).toBeCloseTo(base * 2, 3);
    expect(gs.activateBoost(4)).toBe(false);
  });

  it("버프는 세이브를 거쳐도 유지되고 잘못된 값은 정규화된다", () => {
    const gs = ready();
    const d = gs.normalize({ buffs: { prodUntil: "x", prodMult: -3, boostUntil: 123 } }, Date.now());
    expect(d.buffs).toMatchObject({ prodUntil: 0, prodMult: 1, boostUntil: 123 });
  });
});
