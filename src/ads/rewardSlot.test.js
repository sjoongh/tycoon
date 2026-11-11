import { beforeEach, describe, expect, it, vi } from "vitest";

const ad = { available: true, result: "rewarded" };
vi.mock("./admob.js", () => ({
  admobAvailable: () => ad.available,
  showRewarded: async () => ad.result,
}));

const { claimReward, rewardStatus } = await import("./rewardSlot.js");

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.document = { dispatchEvent: vi.fn() };
  globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
  ad.available = true; ad.result = "rewarded";
});

describe("보상 슬롯 — 광고 모드", () => {
  it("광고를 끝까지 보면 지급하고 하루 횟수를 센다", async () => {
    expect(await claimReward("boost")).toBe(true);
    expect(rewardStatus("boost").left).toBe(1);
  });

  it("중도 종료는 지급하지 않는다", async () => {
    ad.result = "dismissed";
    expect(await claimReward("boost")).toBe(false);
    expect(rewardStatus("boost").left).toBe(2);
  });

  it("광고 로드 실패 시 무료 쿨다운이 찼으면 무료로 대신 지급하고, 광고 횟수는 쓰지 않는다", async () => {
    ad.result = "failed";
    expect(await claimReward("golden3x")).toBe(true);
    expect(rewardStatus("golden3x").left).toBe(20);
    // 무료 쿨다운(10분) 안에서 다시 실패하면 지급하지 않고 실패 이벤트를 낸다
    vi.useFakeTimers({ now: Date.now() + 2 * 60000 });
    expect(await claimReward("golden3x")).toBe(false);
    const types = document.dispatchEvent.mock.calls.map(([e]) => e.type);
    expect(types).toContain("gp:reward-failed");
    vi.useRealTimers();
  });

  it("무료 쿨다운이 없는 보상(오프라인 2배)은 실패 대체 지급이 없다", async () => {
    ad.result = "failed";
    expect(await claimReward("offline2x")).toBe(false);
  });
});

describe("보상 슬롯 — 무료 모드(웹)", () => {
  it("쿨다운이 지나야 다시 받을 수 있다", async () => {
    ad.available = false;
    expect(await claimReward("golden3x")).toBe(true);
    expect(rewardStatus("golden3x").ready).toBe(false);
    expect(await claimReward("golden3x")).toBe(false);
  });
});
