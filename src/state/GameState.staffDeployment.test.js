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

describe("직원 배치 저장 호환", () => {
  it("v7 세이브의 채용 직원 중 앞 세 명을 자동 배치하고 v9로 올린다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({
      version: 7,
      lastSeenAt: now,
      lastSavedAt: now,
      staff: { clerk: 2, auditor: 0, runner: 5, engineer: 1, analyst: 3, speaker: 4 },
    }));

    const gs = new GameState();

    expect(gs.data.version).toBe(10);
    expect(gs.staffSlots()).toEqual(["clerk", "runner", "engineer"]);
  });

  it("손상된 슬롯은 미채용·중복·네 번째 직원을 제거한다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({
      version: 9,
      lastSeenAt: now,
      lastSavedAt: now,
      staff: { clerk: 2, auditor: 0, runner: 5, engineer: 1, analyst: 3 },
      staffSlots: ["clerk", "clerk", "auditor", "unknown", "runner", "engineer", "analyst"],
    }));

    expect(new GameState().staffSlots()).toEqual(["clerk", "runner", "engineer"]);
  });

  it("실행 중 슬롯 배열이 오염돼도 조회 결과는 안전하게 정규화한다", () => {
    const gs = new GameState();
    gs.data.staff = { clerk: 2, auditor: 0, runner: 5, engineer: 1, analyst: 3, speaker: 0 };
    gs.data.staffSlots = ["clerk", "clerk", "auditor", "unknown", "runner", "engineer", "analyst"];

    expect(gs.staffSlots()).toEqual(["clerk", "runner", "engineer"]);
  });
});

describe("직원 배치 동작과 효과", () => {
  it("세 자리까지만 배치하고 해제한 선택을 즉시 저장한다", () => {
    const gs = new GameState();
    gs.data.staff = { clerk: 5, auditor: 5, runner: 5, engineer: 5, analyst: 0, speaker: 0 };

    expect(gs.deployStaff("clerk")).toBe(true);
    expect(gs.deployStaff("auditor")).toBe(true);
    expect(gs.deployStaff("runner")).toBe(true);
    expect(gs.deployStaff("engineer")).toBe(false);
    expect(gs.undeployStaff("auditor")).toBe(true);
    expect(gs.deployStaff("engineer")).toBe(true);
    expect(JSON.parse(store.get(SAVE_KEY)).staffSlots).toEqual(["clerk", "runner", "engineer"]);
  });

  it("미배치 직원의 기존 기본 효과는 유지하고 배치 보너스만 추가한다", () => {
    const gs = new GameState();
    gs.data.facilities.desk = 10;
    gs.data.staff.engineer = 10;
    const baseStaffMultiplier = gs.staffMultiplierFor(gs.data);
    const baseCps = gs.cpsFor(gs.data);

    expect(gs.deployStaff("engineer")).toBe(true);

    expect(gs.staffMultiplierFor(gs.data)).toBe(baseStaffMultiplier);
    expect(gs.cpsFor(gs.data)).toBeGreaterThan(baseCps);
    expect(gs.staffDeploymentEffectFor(gs.data, "cpsPct")).toBeCloseTo(0.09, 6);
  });

  it("직원별 배치 능력이 탭·사건 방어·피버에 반영된다", () => {
    const gs = new GameState();
    gs.data.staff.clerk = 10;
    gs.data.staff.auditor = 10;
    gs.data.staff.runner = 10;
    const baseClick = gs.clickPower();
    gs.deployStaff("clerk");
    gs.deployStaff("auditor");
    gs.deployStaff("runner");
    gs.data.operations.picks["night-shift"] = 1;

    expect(gs.clickPower()).toBe(baseClick + 3);
    expect(gs.eventTrustEffect(-10)).toBeCloseTo(-8.2, 6);
    expect(gs.addFever("tap", 10).added).toBeCloseTo(11.2, 6);
  });

  it("감사 뒤에는 직원과 이번 런 배치를 함께 초기화한다", () => {
    const gs = new GameState();
    gs.data.staff.clerk = 5;
    gs.data.staffSlots = ["clerk"];
    gs.data.stage.area = 4;

    expect(gs.prestigeReset()).toBe(true);
    expect(gs.staffLevel("clerk")).toBe(0);
    expect(gs.staffSlots()).toEqual([]);
  });
});
