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

function fixedOfflineEconomy(gs) {
  gs.cpsFor = () => 1;
  gs.explainPerSecondFor = () => 0;
  gs.offlineRateFor = () => 1;
  gs.offlineCapMsFor = () => 8 * 3600000;
}

describe("오프라인 구역 진행 이월", () => {
  it("v5 이하 세이브는 빈 미처리 개표함으로 정규화한다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({ version: 5, offlineCarryVotes: "broken", lastSeenAt: now, lastSavedAt: now }));
    const gs = new GameState();
    expect(gs.data.version).toBe(6);
    expect(gs.data.offlineCarryVotes).toBe(0);
  });

  it("30초 이상 지난 저장 세이브도 신규 게임으로 대체하지 않고 오프라인 정산한다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({
      version: 5,
      votes: 1234,
      selectedChar: "classic",
      tutorial: { step: 5, done: true, openingSeen: true },
      stage: { area: 2, progress: 100, target: 2862, completed: 1 },
      facilities: { desk: 2 },
      lastSeenAt: now - 3600000,
      lastSavedAt: now - 3600000,
    }));

    const gs = new GameState();

    expect(gs.data.stage.area).toBe(2);
    expect(gs.data.votes).toBeGreaterThan(1234);
    expect(gs.data.tutorial.done).toBe(true);
    expect(gs.offlineReward?.elapsed).toBeGreaterThanOrEqual(3599000);
  });

  it("정산 직후 빠르게 재접속해도 같은 부재 보상을 다시 지급하지 않는다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({
      version: 5,
      votes: 500,
      selectedChar: "classic",
      tutorial: { step: 5, done: true, openingSeen: true },
      stage: { area: 2, progress: 2500, target: 2862, completed: 1 },
      facilities: { desk: 2 },
      lastSeenAt: now - 3600000,
      lastSavedAt: now - 3600000,
    }));

    const first = new GameState();
    const afterFirst = {
      votes: first.data.votes,
      progress: first.data.stage.progress,
      carry: first.data.offlineCarryVotes,
      lastSavedAt: first.data.lastSavedAt,
    };
    const second = new GameState();

    expect(second.offlineReward).toBeNull();
    expect(second.data.votes).toBe(afterFirst.votes);
    expect(second.data.stage.progress).toBe(afterFirst.progress);
    expect(second.data.offlineCarryVotes).toBe(afterFirst.carry);
    expect(second.data.lastSavedAt).toBe(afterFirst.lastSavedAt);
  });

  it("현재 구역을 채우고 남은 오프라인 표를 진행 크레딧으로 보관한다", () => {
    const gs = new GameState();
    fixedOfflineEconomy(gs);
    const now = Date.now();
    gs.data.stage.area = 2;
    gs.data.stage.target = gs.stageTarget(2);
    gs.data.stage.progress = gs.data.stage.target - 100;
    gs.data.lastSeenAt = now - 3600000;

    const beforeVotes = gs.data.votes;
    const beforeTotalVotes = gs.data.stats.totalVotes;
    const reward = gs.applyOfflineProgress(gs.data, now);

    expect(reward).toMatchObject({ votes: 3600, progressApplied: 100, carryAdded: 3500, carryTotal: 3500 });
    expect(gs.data.stage.progress).toBe(gs.data.stage.target);
    expect(gs.data.offlineCarryVotes).toBe(3500);
    expect(gs.data.votes - beforeVotes).toBe(3600);
    expect(gs.data.stats.totalVotes - beforeTotalVotes).toBe(3600);
  });

  it("하루 1회 2배는 표를 한 번 더 주고 이미 찬 구역의 초과분만 이월한다", () => {
    const gs = new GameState();
    fixedOfflineEconomy(gs);
    const now = Date.now();
    gs.data.stage.target = 1000;
    gs.data.stage.progress = 900;
    gs.data.lastSeenAt = now - 3600000;
    gs.offlineReward = gs.applyOfflineProgress(gs.data, now);
    const beforeVotes = gs.data.votes;
    const beforeTotal = gs.data.stats.totalVotes;

    const bonus = gs.claimOfflineBonus();

    expect(bonus).toMatchObject({ votes: 3600, progressApplied: 0, carryAdded: 3600, carryTotal: 7100 });
    expect(gs.data.votes - beforeVotes).toBe(3600);
    expect(gs.data.stats.totalVotes - beforeTotal).toBe(3600);
    expect(gs.data.offlineCarryVotes).toBe(7100);
    expect(gs.claimOfflineBonus()).toBeNull();
  });

  it("지역 완료마다 새 지역에 이월하고 체크포인트 보스·작전 게이트를 보존한다", () => {
    const gs = new GameState();
    gs.checkProgression = () => {};
    gs.data.stage.area = 2;
    gs.data.stage.target = gs.stageTarget(2);
    gs.data.stage.progress = gs.data.stage.target;
    gs.data.offlineCarryVotes = 5000;

    const area2Reward = gs.stageCompletionVotes(2);
    const area3Target = gs.stageTarget(3);
    const expectedArea3CarryUse = Math.min(5000, Math.max(0, area3Target - area2Reward));
    expect(gs.advanceStage()).toBe(true);
    expect(gs.data.stage.area).toBe(3);
    expect(gs.data.stage.progress).toBe(Math.min(area3Target, area2Reward + expectedArea3CarryUse));
    expect(gs.data.offlineCarryVotes).toBe(5000 - expectedArea3CarryUse);
    expect(gs.bossRequired()).toBe(true);
    expect(gs.advanceStage()).toBe(false);

    expect(gs.startBoss()).toBe(true);
    expect(gs.skipBoss()).toBe(true);
    expect(gs.advanceStage()).toBe(true);
    expect(gs.data.stage.area).toBe(4);
    expect(gs.data.operations.draft?.area).toBe(3);
    expect(gs.advanceStage()).toBe(false);
  });

  it("미처리 진행은 저장·재접속에는 남고 감사에는 초기화된다", () => {
    const gs = new GameState();
    gs.data.offlineCarryVotes = 4321;
    gs.save(false);
    const restored = new GameState();
    expect(restored.data.offlineCarryVotes).toBe(4321);

    restored.data.stage.area = 4;
    restored.data.stage.target = restored.stageTarget(4);
    expect(restored.prestigeReset()).toBe(true);
    expect(restored.data.offlineCarryVotes).toBe(0);
  });
});

describe("감사 판단 정보", () => {
  it("현재 대비 영구 생산 증가율과 세 단계 추천을 계산한다", () => {
    const gs = new GameState();
    gs.data.stage.area = 4;
    gs.data.stage.target = gs.stageTarget(4);
    const projection = gs.prestigeProjection();

    expect(projection.earned).toBeGreaterThan(0);
    expect(projection.gainPct).toBeGreaterThan(0);
    expect(projection.advice.key).toBe("ready");
    expect(gs.prestigeAdviceFor(9.9, 4).key).toBe("wait");
    expect(gs.prestigeAdviceFor(10, 4).key).toBe("ready");
    expect(gs.prestigeAdviceFor(25, 4).key).toBe("strong");
    expect(gs.prestigeAdviceFor(0, 0).key).toBe("locked");
  });
});
