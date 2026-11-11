import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimReward, rewardStatus } from "./rewardSlot.js";

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.document = { dispatchEvent: vi.fn() };
  globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
});

describe("보상 슬롯(무료 쿨다운 전용)", () => {
  it("쿨다운이 지나야 다시 받을 수 있다", async () => {
    const t0 = 1_000_000_000;
    expect(await claimReward("golden3x", t0)).toBe(true);
    expect(rewardStatus("golden3x", t0 + 60000).ready).toBe(false);
    expect(await claimReward("golden3x", t0 + 60000)).toBe(false);
    expect(await claimReward("golden3x", t0 + 10 * 60000)).toBe(true);
  });

  it("생산 2배는 하루 1회", async () => {
    const t0 = 1_000_000_000;
    expect(await claimReward("boost", t0)).toBe(true);
    expect(rewardStatus("boost", t0 + 23 * 3600000).ready).toBe(false);
    expect(rewardStatus("boost", t0 + 24 * 3600000).ready).toBe(true);
  });

  it("예전 광고 모드 기록(lastAt)도 쿨다운 기준으로 읽는다", () => {
    const t0 = 1_000_000_000;
    localStorage.setItem("gp-reward-v1", JSON.stringify({ boost: { lastAt: t0, count: 1 } }));
    expect(rewardStatus("boost", t0 + 3600000).ready).toBe(false);
  });

  it("없는 보상 종류는 받을 수 없다", async () => {
    expect(await claimReward("offline2x")).toBe(false);
  });
});
