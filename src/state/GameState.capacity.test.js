import { beforeEach, describe, expect, it } from "vitest";
import { GameState } from "./GameState.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  return store;
}

beforeEach(() => { installLocalStorage(); });

function setup(facilities) {
  const gs = new GameState();
  gs.data.paused = false;
  gs.data.stage.area = 6;
  gs.data.facilities = { desk: 0, sorter: 0, notice: 0, server: 0, archive: 0, studio: 0, ...facilities };
  gs.data.staff = { clerk: 0, auditor: 0, runner: 0, engineer: 0, analyst: 0, speaker: 0 };
  gs.data.trust = 72;
  gs.data.backlog = 0;
  gs.data.stage.target = 1e12;
  gs.checkProgression = () => {}; // 목표·업적 보상(표 지급)이 생산 측정을 오염시키지 않게 격리
  return gs;
}

describe("처리 용량과 적체(병목)", () => {
  it("접수창구만 키운 빌드는 용량에 막혀 실효 생산이 유입보다 작다", () => {
    const gs = setup({ desk: 30 });
    const intake = gs.intakeFor(gs.data);
    const capacity = gs.capacityFor(gs.data);
    expect(capacity).toBeLessThan(intake);
    expect(gs.cpsFor(gs.data)).toBeCloseTo(capacity, 6);
  });

  it("분류·기록 시설을 갖춘 빌드는 용량이 유입을 넘어 유입 전량이 생산된다", () => {
    const gs = setup({ desk: 10, sorter: 10, archive: 10, server: 10 });
    expect(gs.capacityFor(gs.data)).toBeGreaterThan(gs.intakeFor(gs.data));
    expect(gs.cpsFor(gs.data)).toBeCloseTo(gs.intakeFor(gs.data), 6);
  });

  it("틱마다 초과 유입은 적체로 쌓이고 믿음을 추가로 깎는다", () => {
    const gs = setup({ desk: 30 });
    const trustBefore = gs.data.trust;
    const decayOnly = gs.trustDecay();
    const expectedBacklog = gs.intakeFor(gs.data) - gs.capacityFor(gs.data); // 틱 전(믿음 변동 전) 기준
    gs.tick();
    expect(gs.data.backlog).toBeGreaterThan(0);
    expect(gs.data.backlog).toBeCloseTo(expectedBacklog, 3);
    // notice 0이므로 회복 없음: 하락폭이 기본 감소보다 커야 한다
    expect(trustBefore - gs.data.trust).toBeGreaterThan(decayOnly);
  });

  it("용량이 생기면 적체가 남는 용량만큼 소화되어 생산에 더해진다", () => {
    const gs = setup({ desk: 2, sorter: 20, archive: 20 });
    gs.data.backlog = 1000;
    const votesBefore = gs.data.votes;
    const intake = gs.intakeFor(gs.data);
    const capacity = gs.capacityFor(gs.data);
    gs.tick();
    const spare = capacity - intake;
    expect(spare).toBeGreaterThan(0);
    expect(gs.data.backlog).toBeCloseTo(1000 - spare, 3);
    expect(gs.data.votes - votesBefore).toBeCloseTo(intake + spare, 3);
  });

  it("운반·전산 직원은 유입보다 용량을 더 키운다(별개 성장 축)", () => {
    const gs = setup({ desk: 10, sorter: 5, server: 5 });
    const i0 = gs.intakeFor(gs.data);
    const c0 = gs.capacityFor(gs.data);
    gs.data.staff.runner = 5;
    gs.data.staff.engineer = 5;
    const i1 = gs.intakeFor(gs.data);
    const c1 = gs.capacityFor(gs.data);
    expect(c1 / c0).toBeGreaterThan(i1 / i0);
  });

  it("오프라인 정산은 실효 생산(min)으로 계산하고 적체를 만들지 않는다", () => {
    const gs = setup({ desk: 30 });
    const now = Date.now();
    gs.data.lastSeenAt = now - 3600_000;
    gs.offlineCapMsFor = () => 8 * 3600_000;
    const r = gs.applyOfflineProgress(gs.data, now);
    expect(r.votes).toBeCloseTo(gs.cpsFor(gs.data) * 3600 * gs.offlineRateFor(gs.data), 3);
    expect(gs.data.backlog).toBe(0);
  });

  it("v9 세이브에 backlog가 없어도 0으로 정규화된다", () => {
    const gs = new GameState();
    const data = gs.normalize({ version: 9, lastSeenAt: Date.now(), lastSavedAt: Date.now() }, Date.now());
    expect(data.backlog).toBe(0);
    expect(data.version).toBe(10);
    const bad = gs.normalize({ version: 9, backlog: "oops" }, Date.now());
    expect(bad.backlog).toBe(0);
  });
});
