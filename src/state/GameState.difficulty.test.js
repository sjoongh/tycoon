import { beforeEach, describe, expect, it } from "vitest";
import { GameState } from "./GameState.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

beforeEach(() => { installLocalStorage(); });

describe("난이도 곡선", () => {
  it("구역 6까지의 목표량은 기존 공식과 같다(첫 감사 도달 시간 보존)", () => {
    const gs = new GameState();
    for (let a = 1; a <= 6; a += 1) {
      expect(gs.stageTarget(a, 0)).toBe(Math.floor(44000 * a ** 1.38));
    }
  });

  it("구역 7부터는 지수가 커져 같은 구역 간격의 증가폭이 더 가파르다", () => {
    const gs = new GameState();
    const old = (a) => Math.floor(44000 * a ** 1.38);
    expect(gs.stageTarget(7, 0)).toBeGreaterThan(old(7));
    const r1 = gs.stageTarget(7, 0) / gs.stageTarget(6, 0);
    const r2 = gs.stageTarget(12, 0) / gs.stageTarget(11, 0);
    expect(r1).toBeGreaterThan(old(7) / old(6));
    // 단조 증가
    for (let a = 2; a <= 20; a += 1) expect(gs.stageTarget(a, 0)).toBeGreaterThan(gs.stageTarget(a - 1, 0));
    expect(r2).toBeGreaterThan(1);
  });

  it("믿음 자연 감소는 구역이 오를수록 커지고 상한이 있다", () => {
    const gs = new GameState();
    gs.data.stage.area = 1;
    const d1 = gs.trustDecay();
    gs.data.stage.area = 6;
    const d6 = gs.trustDecay();
    gs.data.stage.area = 40;
    const d40 = gs.trustDecay();
    expect(d6).toBeGreaterThan(d1);
    expect(d40).toBeLessThanOrEqual(0.12);
    expect(d1).toBeCloseTo(0.06, 6);
  });

  it("보스를 건너뛰면 보상 없이 적체가 쌓인다", () => {
    const gs = new GameState();
    gs.data.stage.area = 3;
    gs.data.stage.target = 10;
    gs.data.stage.progress = 10;
    gs.data.facilities = { desk: 10, sorter: 5, notice: 0, server: 0, archive: 0, studio: 0 };
    gs.data.backlog = 0;
    gs.startBoss();
    expect(gs.bossActive()).toBe(true);
    gs.skipBoss();
    expect(gs.bossActive()).toBe(false);
    expect(gs.data.backlog).toBeGreaterThan(0);
  });
});
