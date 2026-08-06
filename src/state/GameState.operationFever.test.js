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

describe("작전 드래프트", () => {
  it("구 세이브를 빈 작전/피버 상태로 정규화한다", () => {
    store.set(SAVE_KEY, JSON.stringify({ version: 3, lastSeenAt: Date.now(), lastSavedAt: Date.now() }));
    const gs = new GameState();
    expect(gs.operationCount()).toBe(0);
    expect(gs.data.operations.draft).toBeNull();
    expect(gs.feverCharge()).toBe(0);
    expect(gs.feverActive()).toBe(false);
  });

  it("1·2구역은 흐름을 막지 않고 3구역 완료 때만 세 장을 만든다", () => {
    const gs = new GameState();
    for (const completedArea of [1, 2]) {
      gs.data.stage.progress = gs.data.stage.target;
      expect(gs.advanceStage()).toBe(true);
      expect(gs.data.operations.draft).toBeNull();
      expect(gs.data.stage.area).toBe(completedArea + 1);
    }
    gs.data.stage.progress = gs.data.stage.target;
    expect(gs.startBoss()).toBe(true);
    for (let index = 0; index < gs.data.boss.target; index += 1) gs.bossAction("rapid");
    expect(gs.advanceStage()).toBe(true);
    expect(gs.data.operations.draft.area).toBe(3);
    expect(gs.operationDraftDefinitions()).toHaveLength(3);
    expect(gs.chooseOperation("not-a-card")).toBe(false);
  });

  it("유효 선택은 레벨과 첫 열기를 저장하고 드래프트를 닫는다", () => {
    const gs = new GameState();
    for (let i = 0; i < 3; i += 1) {
      gs.data.stage.progress = gs.data.stage.target;
      if (gs.bossRequired()) {
        gs.startBoss();
        gs.skipBoss();
      }
      gs.advanceStage();
    }
    const id = gs.data.operations.draft.choices[0];
    expect(gs.chooseOperation(id)).toBe(true);
    expect(gs.operationLevel(id)).toBe(1);
    expect(gs.data.operations.draft).toBeNull();
    expect(gs.feverCharge()).toBe(12);
    expect(JSON.parse(store.get(SAVE_KEY)).operations.picks[id]).toBe(1);
  });

  it("계열 동률이면 마지막으로 고른 작전 계열을 다음 피버로 삼는다", () => {
    const gs = new GameState();
    gs.data.operations.picks["manual-count"] = 1;
    gs.data.operations.picks["night-shift"] = 1;
    gs.data.operations.lastId = "night-shift";
    expect(gs.dominantOperationFamily()).toBe("build");
  });
});

describe("개표 피버", () => {
  it("첫 수검표 작전부터 탭 위력이 즉시 오른다", () => {
    const gs = new GameState();
    const before = gs.clickPower();
    gs.data.operations.picks["manual-count"] = 1;
    expect(gs.clickPower()).toBe(before + 1);
  });

  it("현장 열기 100에서 12초 피버가 한 번 발동한다", () => {
    const gs = new GameState();
    gs.data.operations.picks["manual-count"] = 1;
    gs.data.fever.charge = 99;
    const now = Date.now();
    const result = gs.addFever("tap", 1, now);
    expect(result.started).toBe(true);
    expect(gs.data.fever.charge).toBe(0);
    expect(gs.feverRemainingMs(now)).toBe(12000);
    expect(gs.feverFamily()).toBe("tap");
    expect(gs.cps() / gs.cpsFor(gs.data)).toBeCloseTo(2, 5);
    expect(gs.feverClickMultiplier(now)).toBe(3);
    expect(gs.addFever("tap", 50, now + 10).added).toBe(0);
  });

  it("작전별 행동 열기 보너스를 합산한다", () => {
    const gs = new GameState();
    gs.data.operations.picks["open-briefing"] = 2;
    const result = gs.addFever("event", 28);
    expect(result.added).toBe(48);
    expect(gs.feverCharge()).toBe(48);
  });

  it("자동 비서 사건은 열기를 대신 채우지 않는다", () => {
    const gs = new GameState();
    gs.data.operations.picks["open-briefing"] = 1;
    gs.applyEffect({ votes: 10, trust: 1 }, { fever: false });
    expect(gs.feverCharge()).toBe(0);
  });

  it("운영 피버는 생산을 5배로 만들고 증설 비용을 25% 더 낮춘다", () => {
    const gs = new GameState();
    gs.data.operations.picks["night-shift"] = 1;
    const beforeCost = gs.cost("desk");
    gs.data.fever.charge = 99;
    const now = Date.now();
    gs.addFever("upgrade", 1, now);
    expect(gs.feverFamily()).toBe("build");
    expect(gs.feverProductionMultiplier(now)).toBe(5);
    expect(gs.cost("desk")).toBeLessThanOrEqual(Math.ceil(beforeCost * 0.75));
  });

  it("대응 피버는 사건·브리핑 대기를 풀고 대응 보상을 2배로 만든다", () => {
    const gs = new GameState();
    gs.data.operations.picks["open-briefing"] = 1;
    gs.data.eventReadyAt = Date.now() + 40000;
    gs.data.briefReadyAt = Date.now() + 40000;
    gs.data.fever.charge = 99;
    const now = Date.now();
    gs.addFever("event", 1, now);
    expect(gs.feverFamily()).toBe("response");
    expect(gs.data.eventReadyAt).toBeLessThanOrEqual(now);
    expect(gs.data.briefReadyAt).toBeLessThanOrEqual(now);
    expect(gs.feverResponseRewardMultiplier(now)).toBe(2);
  });

  it("마지막 4초에만 피니셔를 한 번 쓰고 남은 피버를 2배로 증폭한다", () => {
    const gs = new GameState();
    gs.data.operations.picks["manual-count"] = 1;
    gs.data.fever.charge = 99;
    const now = Date.now();
    gs.addFever("tap", 1, now);
    expect(gs.activateFeverFinisher(now + 7999)).toBe(false);
    expect(gs.activateFeverFinisher(now + 8000)).toBe(true);
    expect(gs.feverProductionMultiplier(now + 8000)).toBe(4);
    expect(gs.feverClickMultiplier(now + 8000)).toBe(6);
    expect(gs.activateFeverFinisher(now + 8001)).toBe(false);
  });

  it("종료 결산 뒤 30초 동안 재충전을 막고 이후 다시 연다", () => {
    const gs = new GameState();
    gs.data.operations.picks["manual-count"] = 1;
    gs.data.fever.charge = 99;
    const now = Date.now();
    gs.addFever("tap", 1, now);
    gs.addVotes(321);
    gs.trackFeverAction(25, now + 1000);
    const report = gs.syncFever(now + 12000);
    expect(report).toMatchObject({ family: "tap", votes: 321, actions: 1, bestCombo: 25 });
    expect(gs.feverRecoveryRemainingMs(now + 12000)).toBe(30000);
    expect(gs.addFever("tap", 50, now + 12001).added).toBe(0);
    expect(gs.addFever("tap", 10, now + 42000).added).toBeGreaterThan(0);
  });
});

describe("감사 초기화", () => {
  it("작전과 피버는 초기화하고 영구 감사 진행은 유지한다", () => {
    const gs = new GameState();
    gs.data.stage.area = 4;
    gs.data.stage.target = gs.stageTarget(4);
    gs.data.operations.picks["night-shift"] = 2;
    gs.data.operations.lastId = "night-shift";
    gs.data.fever.charge = 64;
    expect(gs.prestigeReset()).toBe(true);
    expect(gs.operationCount()).toBe(0);
    expect(gs.data.operations.draft).toBeNull();
    expect(gs.feverCharge()).toBe(0);
    expect(gs.data.fever.endsAt).toBe(0);
    expect(gs.data.fever.recoveryEndsAt).toBe(0);
    expect(gs.data.fever.report).toBeNull();
    expect(gs.data.prestige.runs).toBe(1);
  });
});
