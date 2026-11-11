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

import { dexSets } from "../data/dexSets.js";
import { officeEvents } from "../data/events.js";

describe("도감 세트(중기 #6)", () => {
  it("75개 사건이 정확히 한 세트씩 속한다", () => {
    const all = dexSets.flatMap((s) => s.events);
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(officeEvents.length);
    const ids = new Set(officeEvents.map((e) => e.id));
    all.forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it("세트를 완성하면 효과가 적용되고 dex-set 이벤트가 난다", () => {
    const gs = ready();
    const set = dexSets.find((s) => s.id === "office");
    const c0 = gs.clickPower();
    let fired = null;
    gs.on("dex-set", (p) => { fired = p; });
    set.events.forEach((id) => gs.markEventSeen(id));
    expect(fired?.id).toBe("office");
    expect(gs.dexSetEffectFor(gs.data, "clickPct")).toBeCloseTo(0.10, 6);
    expect(gs.clickPower()).toBeGreaterThanOrEqual(c0);
    // 수집 수 마일스톤(10종 +3%)이 유입·용량에 함께 붙으므로 용량/유입 비율로 세트 효과만 본다
    const r0 = gs.capacityFor(gs.data) / gs.intakeFor(gs.data);
    dexSets.find((s) => s.id === "recount").events.forEach((id) => gs.markEventSeen(id));
    const r1 = gs.capacityFor(gs.data) / gs.intakeFor(gs.data);
    expect(r1 / r0).toBeCloseTo(1.10, 6);
  });

  it("nextDexSet 은 완성에 가장 가까운 미완성 세트를 고른다", () => {
    const gs = ready();
    const s = dexSets.find((x) => x.id === "history");
    s.events.slice(0, 4).forEach((id) => gs.markEventSeen(id));
    expect(gs.nextDexSet().set.id).toBe("history");
  });
});
