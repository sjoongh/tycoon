import { beforeEach, describe, expect, it } from "vitest";
import { BOSS_DURATION_MS, bossRewardBonus } from "../data/bosses.js";
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

function readyArea(gs, area) {
  gs.checkProgression = () => {};
  gs.data.stage.area = area;
  gs.data.stage.target = gs.stageTarget(area);
  gs.data.stage.progress = gs.data.stage.target;
}

describe("체크포인트 보스 상태", () => {
  it("구 세이브를 비활성 보스 상태로 정규화한다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({ version: 4, lastSeenAt: now, lastSavedAt: now }));
    const gs = new GameState();
    expect(gs.data.version).toBe(5);
    expect(gs.data.boss).toMatchObject({ active: false, clearedArea: 0, outcome: null });
  });

  it("일반 구역은 그대로 완료하고 3구역은 명시적으로 보스를 시작해야 한다", () => {
    const gs = new GameState();
    readyArea(gs, 2);
    expect(gs.bossRequired()).toBe(false);
    expect(gs.advanceStage()).toBe(true);

    readyArea(gs, 3);
    expect(gs.bossRequired()).toBe(true);
    expect(gs.advanceStage()).toBe(false);
    const now = Date.now();
    expect(gs.startBoss(now)).toBe(true);
    expect(gs.startBoss(now + 1)).toBe(false);
    expect(gs.data.boss).toMatchObject({ active: true, area: 3, progress: 0 });
    expect(gs.data.boss.endsAt - gs.data.boss.startedAt).toBe(BOSS_DURATION_MS);
  });

  it("목표를 채우면 성공 보너스를 새 구역 진행도와 표에 한 번만 지급한다", () => {
    const gs = new GameState();
    readyArea(gs, 3);
    const now = Date.now();
    gs.startBoss(now);
    const target = gs.data.boss.target;
    expect(gs.addBossProgress(target, now + 500)).toBe(target);
    expect(gs.data.boss).toMatchObject({ active: false, clearedArea: 3, outcome: "success" });

    const base = gs.stageCompletionVotes(3);
    const bonus = bossRewardBonus(base);
    expect(gs.advanceStage()).toBe(true);
    expect(gs.data.stage.area).toBe(4);
    expect(gs.data.votes).toBe(base + bonus);
    expect(gs.data.stage.progress).toBe(base + bonus);
    expect(gs.data.operations.draft.area).toBe(3);
    expect(gs.data.boss).toMatchObject({ active: false, clearedArea: 0, outcome: null });
    expect(gs.advanceStage()).toBe(false);
  });

  it("시간 만료와 건너뛰기는 진행을 열되 추가 보상을 주지 않는다", () => {
    for (const outcome of ["failed", "skipped"]) {
      store = installLocalStorage();
      const gs = new GameState();
      readyArea(gs, 3);
      const now = Date.now();
      gs.startBoss(now);
      if (outcome === "failed") gs.syncBoss(now + BOSS_DURATION_MS);
      else gs.skipBoss(now + 100);
      expect(gs.data.boss).toMatchObject({ active: false, clearedArea: 3, outcome });
      expect(gs.advanceStage()).toBe(true);
      expect(gs.data.votes).toBe(gs.stageCompletionVotes(3));
    }
  });

  it("진행 중 저장이 만료된 뒤 재접속하면 실패로 정리하고 구역을 잠그지 않는다", () => {
    const gs = new GameState();
    readyArea(gs, 3);
    const now = Date.now();
    gs.startBoss(now);
    const saved = structuredClone(gs.data);
    saved.boss.startedAt = now - BOSS_DURATION_MS - 1;
    saved.boss.endsAt = now - 1;
    saved.lastSeenAt = now;
    saved.lastSavedAt = now;
    store.set(SAVE_KEY, JSON.stringify(saved));

    const restored = new GameState();
    expect(restored.data.boss).toMatchObject({ active: false, clearedArea: 3, outcome: "failed" });
    expect(restored.bossRequired()).toBe(false);
    expect(restored.advanceStage()).toBe(true);
  });

  it("감사 초기화는 진행 중이던 보스 상태를 제거한다", () => {
    const gs = new GameState();
    readyArea(gs, 4);
    gs.data.boss = {
      active: true,
      area: 3,
      progress: 10,
      target: 20,
      startedAt: Date.now(),
      endsAt: Date.now() + BOSS_DURATION_MS,
      clearedArea: 0,
      outcome: null,
    };
    expect(gs.prestigeReset()).toBe(true);
    expect(gs.data.boss).toMatchObject({ active: false, area: 0, progress: 0, clearedArea: 0, outcome: null });
  });
});
