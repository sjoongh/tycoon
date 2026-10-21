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

function rich(gs) {
  gs.data.votes = 1e12;
  gs.data.explain = 1e12;
  return gs;
}

describe("시설 선행 조건", () => {
  it("투명분류함은 1구역이어도 접수창구 Lv.5 전에는 잠긴다", () => {
    const gs = rich(new GameState());
    gs.data.stage.area = 1;
    gs.data.facilities.desk = 4;
    expect(gs.isUnlocked("sorter")).toBe(false);
    expect(gs.unlockReason("sorter")).toMatchObject({ facility: "desk", level: 5 });
    gs.data.facilities.desk = 5;
    expect(gs.isUnlocked("sorter")).toBe(true);
    expect(gs.unlockReason("sorter")).toBeNull();
  });

  it("구역 조건과 시설 조건을 둘 다 만족해야 열린다 — 구역이 먼저 막히면 구역 사유를 돌려준다", () => {
    const gs = rich(new GameState());
    gs.data.stage.area = 1;
    gs.data.facilities = { desk: 20, sorter: 20, notice: 20, server: 20, archive: 20, studio: 0 };
    expect(gs.isUnlocked("studio")).toBe(false);
    expect(gs.unlockReason("studio")).toMatchObject({ area: 5 });
    gs.data.stage.area = 5;
    expect(gs.isUnlocked("studio")).toBe(true);
  });

  it("잠긴 시설은 업그레이드와 일괄구매가 거부된다", () => {
    const gs = rich(new GameState());
    gs.data.stage.area = 3;
    gs.data.facilities = { desk: 1, sorter: 0, notice: 0, server: 0, archive: 0, studio: 0 };
    expect(gs.upgrade("sorter")).toBe(false);
    expect(gs.facilityBulkPlan("sorter", "max").levels).toBe(0);
    expect(gs.level("sorter")).toBe(0);
  });

  it("기존 세이브에서 이미 올라간 시설은 선행 조건을 못 채워도 그대로 보존된다", () => {
    const gs = rich(new GameState());
    gs.data.stage.area = 3;
    gs.data.facilities = { desk: 1, sorter: 7, notice: 0, server: 0, archive: 0, studio: 0 };
    gs.data = gs.normalize(gs.data, Date.now());
    expect(gs.level("sorter")).toBe(7);
    expect(gs.cpsFor(gs.data)).toBeGreaterThan(0);
  });
});

describe("직원 채용 조건과 상한", () => {
  it("담당 시설이 없으면 채용할 수 없다", () => {
    const gs = rich(new GameState());
    gs.data.stage.area = 5;
    gs.data.facilities.server = 0;
    expect(gs.hireBlockReason("engineer")).toMatchObject({ facility: "server", level: 1 });
    expect(gs.hireStaff("engineer")).toBe(false);
    expect(gs.staffBulkPlan("engineer", 1).levels).toBe(0);
  });

  it("직원 레벨 상한은 min(20, 담당 시설 레벨)이다", () => {
    const gs = rich(new GameState());
    gs.data.facilities.desk = 3;
    expect(gs.staffMaxLevel("clerk")).toBe(3);
    gs.data.staff.clerk = 3;
    expect(gs.hireStaff("clerk")).toBe(false);
    expect(gs.hireBlockReason("clerk")).toMatchObject({ facility: "desk", level: 4 });
    gs.data.facilities.desk = 4;
    expect(gs.hireStaff("clerk")).toBe(true);
    expect(gs.staffLevel("clerk")).toBe(4);
    gs.data.facilities.desk = 60;
    expect(gs.staffMaxLevel("clerk")).toBe(20);
  });

  it("상한을 넘긴 기존 세이브는 깎지 않고 다음 채용만 막는다", () => {
    const gs = rich(new GameState());
    gs.data.facilities.desk = 2;
    gs.data.staff.clerk = 9;
    gs.data = gs.normalize(gs.data, Date.now());
    expect(gs.staffLevel("clerk")).toBe(9);
    expect(gs.staffCapped("clerk")).toBe(true);
    expect(gs.hireStaff("clerk")).toBe(false);
    expect(gs.staffBulkPlan("clerk", "max").levels).toBe(0);
  });
});
