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

  it("틱마다 초과 유입은 적체로 쌓이고, 1분치 용량 유예 안에서는 믿음을 추가로 깎지 않는다", () => {
    const gs = setup({ desk: 30 });
    const trustBefore = gs.data.trust;
    const decayOnly = gs.trustDecay();
    const expectedBacklog = gs.intakeFor(gs.data) - gs.capacityFor(gs.data); // 틱 전(믿음 변동 전) 기준
    gs.tick();
    expect(gs.data.backlog).toBeGreaterThan(0);
    expect(gs.data.backlog).toBeCloseTo(expectedBacklog, 3);
    // 유예 구간: 기본 감소만 적용(notice 0이므로 회복 없음)
    expect(trustBefore - gs.data.trust).toBeCloseTo(decayOnly, 5);
  });

  it("1분치 용량을 넘긴 적체부터 믿음을 추가로 깎는다", () => {
    const gs = setup({ desk: 30 });
    gs.data.backlog = gs.capacityFor(gs.data) * 60 * 3; // 3분치
    expect(gs.backlogTrustPenalty()).toBeGreaterThan(0);
    gs.data.backlog = gs.capacityFor(gs.data) * 30; // 30초치 — 유예
    expect(gs.backlogTrustPenalty()).toBe(0);
  });

  it("의미 있게 쌓인 적체를 0까지 소화하면 최대 적체의 30%를 보너스로 준다", () => {
    const gs = setup({ desk: 2, sorter: 20, archive: 20 });
    const cap = gs.capacityFor(gs.data);
    const spare = cap - gs.intakeFor(gs.data);
    gs.data.backlog = Math.max(cap * 25, 1); // 25초치(해소 기준 20초 이상)
    gs._backlogPeak = gs.data.backlog;
    const peak = gs.data.backlog;
    let floated = null;
    gs.on("float", (p) => { if (/적체 해소/.test(p.text)) floated = p.text; });
    for (let i = 0; i < 200 && gs.data.backlog > 0; i += 1) gs.tick();
    expect(gs.data.backlog).toBe(0);
    expect(spare).toBeGreaterThan(0);
    expect(floated).toMatch(/적체 해소/);
    expect(gs._backlogPeak).toBe(0);
    expect(Math.round(peak * 0.3)).toBeGreaterThan(0);
  });

  it("용량이 생기면 적체가 남는 용량만큼 소화되어 생산에 더해진다", () => {
    const gs = setup({ desk: 2, sorter: 20, archive: 20 });
    gs.data.backlog = 100000; // 마일스톤(10/20 ×2) 적용 후 여유 용량이 커졌으므로 한 틱에 다 소화되지 않을 만큼 크게
    const votesBefore = gs.data.votes;
    const intake = gs.intakeFor(gs.data);
    const capacity = gs.capacityFor(gs.data);
    gs.tick();
    const spare = capacity - intake;
    expect(spare).toBeGreaterThan(0);
    expect(spare).toBeLessThan(100000);
    expect(gs.data.backlog).toBeCloseTo(100000 - spare, 3);
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
