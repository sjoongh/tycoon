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

describe("작전 드래프트", () => {
  it("구 세이브를 빈 작전/피버 상태로 정규화한다", () => {
    store.set(SAVE_KEY, JSON.stringify({ version: 3, lastSeenAt: Date.now(), lastSavedAt: Date.now() }));
    const gs = new GameState();
    expect(gs.operationCount()).toBe(0);
    expect(gs.data.operations.draft).toBeNull();
    expect(gs.feverCharge()).toBe(0);
    expect(gs.feverActive()).toBe(false);
  });

  it("구역 완료 시 세 장을 만들고 드래프트 밖 선택은 거부한다", () => {
    const gs = new GameState();
    gs.data.stage.progress = gs.data.stage.target;
    expect(gs.advanceStage()).toBe(true);
    expect(gs.data.operations.draft.area).toBe(1);
    expect(gs.operationDraftDefinitions()).toHaveLength(3);
    expect(gs.chooseOperation("not-a-card")).toBe(false);
  });

  it("유효 선택은 레벨과 첫 열기를 저장하고 드래프트를 닫는다", () => {
    const gs = new GameState();
    gs.data.stage.progress = gs.data.stage.target;
    gs.advanceStage();
    const id = gs.data.operations.draft.choices[0];
    expect(gs.chooseOperation(id)).toBe(true);
    expect(gs.operationLevel(id)).toBe(1);
    expect(gs.data.operations.draft).toBeNull();
    expect(gs.feverCharge()).toBe(12);
    expect(JSON.parse(store.get(SAVE_KEY)).operations.picks[id]).toBe(1);
  });
});

describe("개표 피버", () => {
  it("첫 수검표 작전부터 탭 위력이 즉시 오른다", () => {
    const gs = new GameState();
    const before = gs.clickPower();
    gs.data.operations.picks["manual-count"] = 1;
    expect(gs.clickPower()).toBe(before + 1);
  });

  it("열기 100에서 한 번 발동하고 실시간 생산만 ×2로 만든다", () => {
    const gs = new GameState();
    gs.data.operations.picks["manual-count"] = 1;
    gs.data.fever.charge = 99;
    const now = Date.now();
    const result = gs.addFever("tap", 1, now);
    expect(result.started).toBe(true);
    expect(gs.data.fever.charge).toBe(0);
    expect(gs.feverRemainingMs(now)).toBe(10000);
    expect(gs.cps() / gs.cpsFor(gs.data)).toBeCloseTo(2, 5);
    expect(gs.addFever("tap", 50, now + 10).added).toBe(0);
  });

  it("작전별 행동 열기 보너스를 합산한다", () => {
    const gs = new GameState();
    gs.data.operations.picks["open-briefing"] = 2;
    const result = gs.addFever("event", 28);
    expect(result.added).toBe(44);
    expect(gs.feverCharge()).toBe(44);
  });

  it("자동 비서 사건은 열기를 대신 채우지 않는다", () => {
    const gs = new GameState();
    gs.data.operations.picks["open-briefing"] = 1;
    gs.applyEffect({ votes: 10, trust: 1 }, { fever: false });
    expect(gs.feverCharge()).toBe(0);
  });
});

describe("감사 초기화", () => {
  it("작전과 피버는 초기화하고 영구 감사 진행은 유지한다", () => {
    const gs = new GameState();
    gs.data.stage.area = 4;
    gs.data.stage.target = gs.stageTarget(4);
    gs.data.operations.picks["night-shift"] = 2;
    gs.data.operations.lastId = "night-shift";
    gs.data.fever.charge = 64;
    expect(gs.prestigeReset()).toBe(true);
    expect(gs.operationCount()).toBe(0);
    expect(gs.data.operations.draft).toBeNull();
    expect(gs.feverCharge()).toBe(0);
    expect(gs.data.fever.endsAt).toBe(0);
    expect(gs.data.prestige.runs).toBe(1);
  });
});
