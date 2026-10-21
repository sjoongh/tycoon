import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAVE_KEY } from "../config.js";
import { clock, offsetFromRoundTrip, clockRolledBack } from "./clock.js";
import { saveBeats, pickSaveWinner, createDebounced } from "./saveWinner.js";
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
beforeEach(() => { store = installLocalStorage(); clock.reset(); });
afterEach(() => { clock.reset(); vi.useRealTimers(); });

describe("clock", () => {
  it("오프셋을 더한 시각을 돌려주고 보정 여부를 기록한다", () => {
    const before = Date.now();
    expect(clock.calibrated()).toBe(false);
    clock.setOffset(5000);
    expect(clock.now()).toBeGreaterThanOrEqual(before + 5000);
    expect(clock.calibrated()).toBe(true);
    clock.setOffset("garbage");
    expect(clock.offset).toBe(0);
  });

  it("왕복 시간의 절반을 더해 서버 시각 오프셋을 추정한다", () => {
    // 서버 시각 1000, 요청 0에 보내 200에 받음 → 받은 순간 서버는 1100 → 오프셋 +900
    expect(offsetFromRoundTrip(1000, 0, 200)).toBe(900);
  });

  it("마지막 저장보다 1시간 넘게 과거면 되감김으로 판정한다", () => {
    const last = 10 * 3600_000;
    expect(clockRolledBack(last - 2 * 3600_000, last)).toBe(true);
    expect(clockRolledBack(last - 30 * 60_000, last)).toBe(false);
    expect(clockRolledBack(last + 1, last)).toBe(false);
    expect(clockRolledBack(5, 0)).toBe(false);
  });
});

describe("GameState 시계 되감김 가드", () => {
  it("로컬 시계가 과거로 가면 출석 보상이 보류되고, 시계가 따라잡으면 재개된다", () => {
    const realNow = Date.now();
    store.set(SAVE_KEY, JSON.stringify({
      version: 10,
      lastSavedAt: realNow + 3 * 3600_000, // 미래에 저장된 기록 = 지금 시계가 3시간 되감김
      lastSeenAt: realNow + 3 * 3600_000,
      daily: { day: 0, streak: 0 },
    }));
    const gs = new GameState();
    expect(gs.clockSuspicious()).toBe(true);
    expect(gs.dailyStatus().available).toBe(false);
    expect(gs.claimDaily()).toBeNull();
    expect(gs.offlineReward).toBeNull();

    clock.setOffset(4 * 3600_000); // 서버 보정으로 시계가 앞서면 정상
    expect(gs.clockSuspicious()).toBe(false);
    expect(gs.dailyStatus().available).toBe(true);
  });

  it("저장 시각은 보정된 시계를 쓴다", () => {
    const gs = new GameState();
    clock.setOffset(7_000_000);
    gs.save(false);
    expect(gs.data.lastSavedAt).toBeGreaterThanOrEqual(Date.now() + 7_000_000 - 50);
  });
});

describe("세이브 승자 규칙", () => {
  it("최신 lastSavedAt이 이기고, 2초 이내 동률이면 누적 표가 큰 쪽이 이긴다", () => {
    const a = { lastSavedAt: 10_000, stats: { totalVotes: 100 } };
    const b = { lastSavedAt: 20_000, stats: { totalVotes: 1 } };
    expect(saveBeats(b, a)).toBe(true);
    expect(saveBeats(a, b)).toBe(false);
    const c = { lastSavedAt: 20_500, stats: { totalVotes: 999 } };
    expect(saveBeats(c, b)).toBe(true);
    expect(saveBeats(b, c)).toBe(false);
    expect(pickSaveWinner(a, b, c)).toBe(c);
    expect(pickSaveWinner(null, undefined, a)).toBe(a);
    expect(pickSaveWinner(null)).toBeNull();
  });

  it("GameState.shouldAdopt는 같은 규칙으로 후보를 판정한다", () => {
    const gs = new GameState();
    gs.data.lastSavedAt = 50_000;
    gs.data.stats.totalVotes = 10;
    expect(gs.shouldAdopt({ lastSavedAt: 60_000, stats: { totalVotes: 0 } })).toBe(true);
    expect(gs.shouldAdopt({ lastSavedAt: 40_000, stats: { totalVotes: 1e9 } })).toBe(false);
    expect(gs.shouldAdopt({ lastSavedAt: 51_000, stats: { totalVotes: 11 } })).toBe(true);
    expect(gs.shouldAdopt({ lastSavedAt: 51_000, stats: { totalVotes: 9 } })).toBe(false);
  });
});

describe("클라우드 저장 디바운스", () => {
  it("연속 요청을 모아 지연 후 1회만 실행하고 flush는 즉시 실행한다", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = createDebounced(fn, 1000);
    d.request(); d.request(); d.request();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(999);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    d.request();
    d.flush();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(d.pending()).toBe(false);
  });

  it("save()는 persist 이벤트를 내보내 클라우드 동기화를 예약할 수 있게 한다", () => {
    const gs = new GameState();
    const spy = vi.fn();
    gs.on("persist", spy);
    gs.save(false);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
