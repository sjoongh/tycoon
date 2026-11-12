import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GameState } from "./GameState.js";
import { clock } from "./clock.js";
import { AGENCIES, agencyEvents, agencyEventById, normalizeAgencyState, CERT_PER_MEDAL, ON_AIR_MULT, AGENCY_EVENT_CHANCE } from "../data/agencies.js";
import { medalUpgrades } from "../data/prestige.js";
import { officeEvents } from "../data/events.js";

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

function unlock(gs, id) {
  const def = AGENCIES.find((a) => a.id === id);
  gs.data.prestige.medals += def.cost;
  expect(gs.buyPrestigeUpgrade(def.upgradeId)).toBe(true);
}

const ev = (id) => agencyEventById(id);

describe("기관 소집 데이터", () => {
  it("기관마다 사건 4종이 있고, 각 선택지에 그 기관 효과가 있다", () => {
    const key = { counsel: "seals", press: "onAir", monitor: "cert" };
    for (const a of AGENCIES) {
      const list = agencyEvents.filter((e) => e.agency === a.id);
      expect(list).toHaveLength(4);
      for (const e of list) {
        expect(e.id.startsWith("ag-")).toBe(true);
        expect(e.left[1][key[a.id]]).toBeGreaterThan(0);
        expect(e.right[1][key[a.id]]).toBeGreaterThan(0);
      }
    }
    expect(new Set(agencyEvents.map((e) => e.id)).size).toBe(agencyEvents.length);
    expect(officeEvents.some((e) => e.id.startsWith("ag-"))).toBe(false);
  });

  it("훈장 상점에 1회 구매 기관 소집 3종이 있다", () => {
    const ups = medalUpgrades.filter((u) => u.agency);
    expect(ups.map((u) => u.agency)).toEqual(AGENCIES.map((a) => a.id));
    for (const u of ups) { expect(u.maxLevel).toBe(1); expect(u.rule).toBeFalsy(); }
  });

  it("잘못된 저장 값을 정리한다", () => {
    expect(normalizeAgencyState({ done: { counsel: -3, press: "2.7", zzz: 9 }, seen: { "ag-press-live": 1, nope: 1 }, cert: 999 }))
      .toEqual({ done: { counsel: 0, press: 2, monitor: 0 }, seen: { "ag-press-live": 1 }, cert: CERT_PER_MEDAL - 1 });
  });
});

describe("기관 사건 출현", () => {
  it("소집 전에는 기관 사건이 나오지 않는다", () => {
    const gs = newGs();
    gs.availableEventChains = () => [];
    for (const v of [0, 0.1, 0.29, 0.5, 0.99]) expect(gs.pickNextEvent(() => v).agency).toBeUndefined();
  });

  it("소집하면 확률 안쪽 굴림에서 그 기관 사건만 나온다", () => {
    const gs = newGs();
    gs.availableEventChains = () => [];
    unlock(gs, "press");
    const low = gs.pickNextEvent(() => AGENCY_EVENT_CHANCE - 0.01);
    expect(low.agency).toBe("press");
    const high = gs.pickNextEvent(() => AGENCY_EVENT_CHANCE + 0.01);
    expect(high.agency).toBeUndefined();
  });

  it("소집 안 한 기관의 사건은 해결되지 않는다", () => {
    const gs = newGs();
    expect(gs.resolveEventChoice(ev("ag-counsel-keys"), "left")).toBeNull();
  });
});

describe("기관 사건 효과", () => {
  it("특검: 인장을 바로 준다(생산 배율용 누적 인장은 그대로)", () => {
    const gs = newGs();
    unlock(gs, "counsel");
    const s0 = gs.data.prestige.seals;
    const t0 = gs.data.prestige.totalSeals;
    const r = gs.resolveEventChoice(ev("ag-counsel-keys"), "left");
    expect(r.agency).toMatchObject({ id: "counsel", seals: 2 });
    expect(gs.data.prestige.seals).toBe(s0 + 2);
    expect(gs.data.prestige.totalSeals).toBe(t0);
  });

  it("취재단: 생중계는 생산 ×3이고, 이어 받으면 시간이 늘어난다", () => {
    const gs = newGs();
    unlock(gs, "press");
    const now = clock.now();
    gs.resolveEventChoice(ev("ag-press-live"), "left");
    expect(gs.data.buffs.prodMult).toBe(ON_AIR_MULT);
    expect(gs.goldenBuffRemainingMs(now)).toBeGreaterThanOrEqual(59000);
    gs.data.eventReadyAt = 0;
    gs.resolveEventChoice(ev("ag-press-live"), "right");
    expect(gs.goldenBuffRemainingMs(now)).toBeGreaterThanOrEqual(89000);
    expect(gs.liveMultiplier(now + 1000)).toBeGreaterThanOrEqual(ON_AIR_MULT);
  });

  it("취재단: 더 센 속보(×7) 중이면 배율은 두고 같은 추가 생산만큼만 늘린다", () => {
    const gs = newGs();
    const now = clock.now();
    gs.data.buffs.prodMult = 7;
    gs.data.buffs.prodUntil = now + 10000;
    const added = gs.startOnAir(60, now);
    expect(gs.data.buffs.prodMult).toBe(7);
    expect(added).toBe(20000); // 60초 × (3-1)/(7-1)
    expect(gs.data.buffs.prodUntil).toBe(now + 30000);
  });

  it("감시단: 인증 점수가 쌓여 정해진 점수마다 훈장이 된다", () => {
    const gs = newGs();
    unlock(gs, "monitor");
    const m0 = gs.data.prestige.medals;
    const tm0 = gs.data.prestige.totalMedals;
    let medals = 0;
    for (let i = 0; i < CERT_PER_MEDAL / 2; i += 1) medals += gs.resolveEventChoice(ev("ag-monitor-arrive"), "left").agency.medals;
    expect(medals).toBe(1);
    expect(gs.data.prestige.medals).toBe(m0 + 1);
    expect(gs.data.prestige.totalMedals).toBe(tm0 + 1);
    expect(gs.certProgress().cert).toBe(0);
    gs.resolveEventChoice(ev("ag-monitor-arrive"), "right");
    expect(gs.certProgress().cert).toBe(1);
  });

  it("기관 사건은 사건 도감에 들어가지 않고 기관 기록에 따로 센다", () => {
    const gs = newGs();
    unlock(gs, "counsel");
    const before = gs.seenEventCount();
    const r = gs.resolveEventChoice(ev("ag-counsel-tape"), "right");
    expect(r.firstSeen).toBe(false);
    expect(gs.seenEventCount()).toBe(before);
    const st = gs.agencyStatus().find((a) => a.id === "counsel");
    expect(st).toMatchObject({ unlocked: true, done: 1, seen: 1, total: 4 });
    expect(gs.data.stats.totalEvents).toBe(1);
  });
});

describe("기관 소집 유지", () => {
  it("감사(리셋)와 재로드 후에도 소집·기록·인증 점수가 남는다", () => {
    const gs = newGs();
    unlock(gs, "monitor");
    gs.resolveEventChoice(ev("ag-monitor-check"), "left");
    gs.prestigePreview = () => 1;
    gs.medalPreview = () => 0;
    gs.prestigeReset();
    expect(gs.agencyUnlocked("monitor")).toBe(true);
    expect(gs.certProgress().cert).toBe(2);
    gs.save(false);
    const gs2 = newGs();
    expect(gs2.agencyUnlocked("monitor")).toBe(true);
    expect(gs2.agencyStatus().find((a) => a.id === "monitor").done).toBe(1);
    expect(gs2.certProgress().cert).toBe(2);
  });
});
