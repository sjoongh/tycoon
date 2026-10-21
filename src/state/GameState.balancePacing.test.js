import { beforeEach, describe, expect, it } from "vitest";
import { SAVE_KEY } from "../config.js";
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

let store;
beforeEach(() => {
  store = installLocalStorage();
});

describe("감사 런 페이싱", () => {
  it("첫 런과 반복 런의 구역 목표 베이스를 구분한다", () => {
    const gs = new GameState();

    expect(gs.stageTarget(1, 0)).toBe(44000);
    expect(gs.stageTarget(1, 1)).toBe(24000);
    expect(gs.stageTarget(3, 0)).toBeGreaterThan(gs.stageTarget(3, 1));
  });

  it("v8 진행 중 세이브는 v9 목표로 옮겨도 진행률을 보존한다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({
      version: 8,
      lastSeenAt: now,
      lastSavedAt: now,
      stage: { area: 2, target: 10000, progress: 3750, completed: 1 },
      prestige: { runs: 0 },
      seenEvents: { "inbox-rush": 1 },
      eventEndings: { "ghost-log-clean-reboot": 1 },
      titles: { clerk9: 2 },
      cosmetics: { "cos-cap": 1 },
    }));

    const gs = new GameState();

    expect(gs.data.version).toBe(10);
    expect(gs.data.stage.target).toBe(gs.stageTarget(2, 0));
    expect(gs.data.stage.progress / gs.data.stage.target).toBeCloseTo(0.375, 6);

    gs.data.stage.area = 4;
    expect(gs.prestigeReset()).toBe(true);
    expect(gs.data.seenEvents).toEqual({ "inbox-rush": 1 });
    expect(gs.data.eventEndings).toEqual({ "ghost-log-clean-reboot": 1 });
    expect(gs.data.titles).toEqual({ clerk9: 2 });
    expect(gs.data.cosmetics).toEqual({ "cos-cap": 1 });
  });

  it.each([
    ["빠진", undefined],
    ["손상된", "not-a-number"],
  ])("version 필드가 %s 구 세이브도 진행률과 자동배치를 복구한다", (_label, version) => {
    const now = Date.now();
    const payload = {
      lastSeenAt: now,
      lastSavedAt: now,
      stage: { area: 2, target: 2862, progress: 1431, completed: 1 },
      staff: { clerk: 1, auditor: 1, runner: 1, engineer: 1 },
      prestige: { runs: 0 },
    };
    if (version !== undefined) payload.version = version;
    store.set(SAVE_KEY, JSON.stringify(payload));

    const gs = new GameState();

    expect(gs.data.stage.progress / gs.data.stage.target).toBeCloseTo(0.5, 6);
    expect(gs.staffSlots()).toEqual(["clerk", "auditor", "runner"]);
  });

  it("첫 감사를 실행하면 반복 런 목표를 즉시 적용한다", () => {
    const gs = new GameState();
    gs.data.stage.area = 4;

    expect(gs.prestigeReset()).toBe(true);
    expect(gs.data.prestige.runs).toBe(1);
    expect(gs.data.stage.area).toBe(1);
    expect(gs.data.stage.target).toBe(24000);
  });
});
