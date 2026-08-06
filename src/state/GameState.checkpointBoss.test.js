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
    expect(gs.data.version).toBe(9);
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
    for (let index = 0; index < target; index += 1) gs.bossAction("rapid", now + 100 + index);
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

  it("연타 처리전은 능동 탭만 세고 자동 생산은 대신 진행하지 않는다", () => {
    const gs = new GameState();
    readyArea(gs, 3);
    gs.startBoss(Date.now());
    const votesBefore = gs.data.votes;
    gs.tick();
    expect(gs.data.votes).toBeGreaterThan(votesBefore);
    expect(gs.data.boss.progress).toBe(0);

    gs.processClick(195, 360);
    expect(gs.data.boss.progress).toBe(1);
    expect(gs.bossPatternStatus().phase.type).toBe("rapid");
    expect(gs.addBossProgress(999)).toBe(0);
    expect(gs.data.boss.progress).toBe(1);
  });

  it("좌우 교대 검인은 빛나는 쪽을 맞혀야만 다음 순서로 넘어간다", () => {
    const gs = new GameState();
    readyArea(gs, 6);
    const now = Date.now();
    gs.startBoss(now);
    let bossActions = 0;
    gs.on("boss-action", () => { bossActions += 1; });
    gs.processClick(195, 360);
    expect(bossActions).toBe(0);
    expect(gs.bossPatternStatus(now).expectedSide).toBe("left");
    expect(gs.bossAction("right", now + 100)).toMatchObject({ accepted: true, correct: false });
    expect(gs.data.boss.progress).toBe(0);
    expect(gs.bossAction("left", now + 200)).toMatchObject({ correct: true });
    expect(gs.bossPatternStatus(now + 200).expectedSide).toBe("right");
    expect(gs.bossAction("right", now + 300)).toMatchObject({ correct: true });
    expect(gs.data.boss.progress).toBe(2);
  });

  it("타이밍 봉인은 NOW 구간에서만 인정하고 성공 뒤 새 주기를 시작한다", () => {
    const gs = new GameState();
    readyArea(gs, 9);
    const now = Date.now();
    gs.startBoss(now);
    expect(gs.bossAction("timing", now + 50)).toMatchObject({ correct: false });
    expect(gs.bossAction("timing", now + 600)).toMatchObject({ correct: true });
    expect(gs.data.boss.progress).toBe(1);
    expect(gs.bossAction("timing", now + 1200)).toMatchObject({ correct: true, finalPhase: true });
    expect(gs.data.boss).toMatchObject({ active: false, clearedArea: 9, outcome: "success" });
  });

  it("후반 최종 보스는 연타→교대→타이밍 세 단계를 순서대로 조합한다", () => {
    const gs = new GameState();
    readyArea(gs, 18);
    const now = Date.now();
    gs.startBoss(now);
    for (let index = 0; index < 4; index += 1) gs.bossAction("rapid", now + 100 + index);
    expect(gs.bossPatternStatus(now + 200).phase.type).toBe("alternate");
    ["left", "right", "left", "right"].forEach((side, index) => gs.bossAction(side, now + 300 + index));
    const timing = gs.bossPatternStatus(now + 400);
    expect(timing.phase.type).toBe("timing");
    gs.bossAction("timing", gs.data.boss.phaseStartedAt + timing.phase.periodMs / 2);
    expect(gs.data.boss).toMatchObject({ active: false, progress: 9, target: 9, outcome: "success" });
  });

  it("조합 보스의 현재 단계와 부분 진행을 저장 후 그대로 복구한다", () => {
    const gs = new GameState();
    readyArea(gs, 12);
    const now = Date.now();
    gs.startBoss(now);
    for (let index = 0; index < 5; index += 1) gs.bossAction("rapid", now + index + 1);
    gs.bossAction("left", now + 100);
    gs.save(false);

    const restored = new GameState();
    expect(restored.data.boss).toMatchObject({ active: true, phaseIndex: 1, phaseProgress: 1, progress: 6, target: 9 });
    expect(restored.bossPatternStatus().expectedSide).toBe("right");
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

  it("구버전 진행 중 보스는 저장된 throughput 목표를 바꾸지 않고 이어간다", () => {
    const gs = new GameState();
    readyArea(gs, 3);
    const now = Date.now();
    gs.data.boss = {
      active: true,
      area: 3,
      progress: 80,
      target: 400,
      startedAt: now - 1000,
      endsAt: now + 7000,
      clearedArea: 0,
      outcome: null,
    };
    gs.save(false);

    const restored = new GameState();
    expect(restored.data.boss).toMatchObject({ active: true, patternVersion: 0, progress: 80, target: 400 });
    restored.processClick(195, 360);
    expect(restored.data.boss.progress).toBeGreaterThan(80);
  });

  it("타이밍 단계 중간 저장은 같은 주기 원점과 남은 시간을 복구한다", () => {
    const gs = new GameState();
    readyArea(gs, 9);
    const now = Date.now();
    const startedAt = now - 700;
    gs.startBoss(startedAt);
    gs.bossAction("timing", startedAt + 600);
    expect(gs.data.boss.phaseProgress).toBe(1);
    const phaseStartedAt = gs.data.boss.phaseStartedAt;
    gs.save(false);

    const restored = new GameState();
    expect(restored.data.boss).toMatchObject({ active: true, phaseIndex: 0, phaseProgress: 1, phaseStartedAt });
    expect(restored.bossRemainingMs(now)).toBe(7300);
    expect(restored.bossPatternStatus(now).timingHot).toBe(false);
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
