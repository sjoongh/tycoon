import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAVE_KEY } from "../config.js";

// Capacitor 네이티브 여부를 테스트마다 바꿀 수 있게 mock
let nativeFlag = false;
const prefsStore = new Map();
const setSpy = vi.fn(async ({ key, value }) => { prefsStore.set(key, value); });
const removeSpy = vi.fn(async ({ key }) => { prefsStore.delete(key); });
const getSpy = vi.fn(async ({ key }) => ({ value: prefsStore.has(key) ? prefsStore.get(key) : null }));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => nativeFlag },
}));
vi.mock("@capacitor/preferences", () => ({
  Preferences: { set: setSpy, get: getSpy, remove: removeSpy },
}));

const { mirrorNativeSave, clearNativeSave, restoreNativeSave } = await import("./persistence.js");

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  nativeFlag = false;
  prefsStore.clear();
  setSpy.mockClear();
  getSpy.mockClear();
  removeSpy.mockClear();
});
afterEach(() => { vi.restoreAllMocks(); });

describe("네이티브 세이브 미러", () => {
  it("웹(비네이티브)에서는 아무것도 쓰지 않는다", async () => {
    nativeFlag = false;
    mirrorNativeSave(JSON.stringify({ a: 1 }));
    await flush();
    expect(setSpy).not.toHaveBeenCalled();
  });

  it("네이티브에서 세이브 JSON을 SharedPreferences에 기록한다", async () => {
    nativeFlag = true;
    mirrorNativeSave(JSON.stringify({ a: 1 }));
    await flush();
    expect(setSpy).toHaveBeenCalledWith({ key: SAVE_KEY, value: JSON.stringify({ a: 1 }) });
    expect(prefsStore.get(SAVE_KEY)).toBe(JSON.stringify({ a: 1 }));
  });

  it("연타로 몰린 저장은 직렬화되어 마지막 값이 남는다", async () => {
    nativeFlag = true;
    mirrorNativeSave("v1");
    mirrorNativeSave("v2");
    mirrorNativeSave("v3");
    await flush();
    await flush();
    expect(prefsStore.get(SAVE_KEY)).toBe("v3");
  });

  it("clearNativeSave는 미러를 지운다", async () => {
    nativeFlag = true;
    prefsStore.set(SAVE_KEY, "old");
    clearNativeSave();
    await flush();
    expect(removeSpy).toHaveBeenCalledWith({ key: SAVE_KEY });
    expect(prefsStore.has(SAVE_KEY)).toBe(false);
  });

  it("미러가 localStorage보다 최신이면 adoptCloudData로 복원한다", async () => {
    nativeFlag = true;
    prefsStore.set(SAVE_KEY, JSON.stringify({ lastSavedAt: 2000 }));
    const gs = { data: { lastSavedAt: 1000 }, adoptCloudData: vi.fn() };

    const restored = await restoreNativeSave(gs);

    expect(restored).toBe(true);
    expect(gs.adoptCloudData).toHaveBeenCalledTimes(1);
    expect(gs.adoptCloudData.mock.calls[0][0]).toEqual({ lastSavedAt: 2000 });
  });

  it("미러가 더 오래됐으면 복원하지 않는다", async () => {
    nativeFlag = true;
    prefsStore.set(SAVE_KEY, JSON.stringify({ lastSavedAt: 500 }));
    const gs = { data: { lastSavedAt: 1000 }, adoptCloudData: vi.fn() };

    const restored = await restoreNativeSave(gs);

    expect(restored).toBe(false);
    expect(gs.adoptCloudData).not.toHaveBeenCalled();
  });

  it("웹에서는 복원 시도 자체를 하지 않는다", async () => {
    nativeFlag = false;
    const gs = { data: { lastSavedAt: 0 }, adoptCloudData: vi.fn() };
    const restored = await restoreNativeSave(gs);
    expect(restored).toBe(false);
    expect(getSpy).not.toHaveBeenCalled();
  });
});
