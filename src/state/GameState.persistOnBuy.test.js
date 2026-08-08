import { beforeEach, describe, expect, it } from "vitest";
import { SAVE_KEY } from "../config.js";
import { GameState } from "./GameState.js";

// 구매 액션(시설 업그레이드/직원 채용)이 10초 자동저장을 기다리지 않고
// 즉시 localStorage에 기록되는지 검증한다 — 구매 직후 앱 종료 시 유실 방지.
function installLocalStorage() {
  const store = new Map();
  let writes = 0;
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { writes += 1; store.set(key, String(value)); },
    removeItem: (key) => store.delete(key),
  };
  return { store, writes: () => writes };
}

let ls;
beforeEach(() => {
  ls = installLocalStorage();
});

function saved() {
  const raw = ls.store.get(SAVE_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("구매 시 즉시 저장", () => {
  it("시설 업그레이드 직후 localStorage에 새 레벨이 기록된다", () => {
    const gs = new GameState();
    gs.data.votes = 1_000_000;
    gs.data.explain = 1_000_000;
    const before = gs.level("desk");

    const ok = gs.upgrade("desk");

    expect(ok).toBe(true);
    expect(saved().facilities.desk).toBe(before + 1);
  });

  it("일괄 업그레이드 직후에도 저장된다", () => {
    const gs = new GameState();
    gs.data.votes = 1_000_000_000;
    gs.data.explain = 1_000_000_000;

    const ok = gs.bulkUpgrade("desk", 5);

    expect(ok).toBe(true);
    expect(saved().facilities.desk).toBe(gs.level("desk"));
    expect(saved().facilities.desk).toBeGreaterThanOrEqual(5);
  });

  it("직원 채용 직후 localStorage에 반영된다", () => {
    const gs = new GameState();
    gs.data.votes = 1_000_000_000;
    gs.data.explain = 1_000_000_000;
    const staffId = "clerk";
    const before = gs.staffLevel(staffId);

    const ok = gs.hireStaff(staffId);

    expect(ok).toBe(true);
    expect(saved().staff[staffId]).toBe(before + 1);
  });

  it("save가 네이티브 미러 훅을 최신 JSON으로 호출한다", () => {
    const gs = new GameState();
    let mirrored = null;
    gs.persistMirror = (json) => { mirrored = json; };
    gs.data.votes = 1_000_000;
    gs.data.explain = 1_000_000;

    gs.upgrade("desk");

    expect(mirrored).not.toBeNull();
    expect(JSON.parse(mirrored).facilities.desk).toBe(gs.level("desk"));
  });

  it("구매가 실패하면(자원 부족) 저장 호출이 없다", () => {
    const gs = new GameState();
    gs.data.votes = 0;
    gs.data.explain = 0;
    const writesBefore = ls.writes();

    const ok = gs.upgrade("desk");

    expect(ok).toBe(false);
    expect(ls.writes()).toBe(writesBefore);
  });
});
