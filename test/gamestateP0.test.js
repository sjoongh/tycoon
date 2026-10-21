// P0 데이터 안전성 회귀 테스트 — Codex 전반 리뷰(docs/improvement-roadmap.md 1차 패치) 대상.
// Phaser는 vitest alias로 스텁 주입(test/helpers/phaser-stub.js). localStorage는 인메모리 스텁.
import { describe, it, expect, beforeEach } from "vitest";
import { GameState } from "../src/state/GameState.js";
import { SAVE_KEY } from "../src/config.js";
import { staffDefinitions } from "../src/data/staff.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  return store;
}

function seedSave(store, patch) {
  // 유효한 기본 세이브를 만든 뒤 patch를 덮어써 시드로 저장
  store.clear();
  const base = new GameState();
  const data = { ...base.data, ...patch, lastSeenAt: Date.now(), lastSavedAt: Date.now() };
  store.set(SAVE_KEY, JSON.stringify(data));
}

let store;
beforeEach(() => {
  store = installLocalStorage();
});

describe("P0-1 세이브 정규화: 0이 기본값으로 되살아나면 안 됨", () => {
  it("믿음 0% 세이브는 0으로 복원된다(72로 리셋 금지)", () => {
    seedSave(store, { trust: 0 });
    const gs = new GameState();
    expect(gs.data.trust).toBe(0);
  });

  it("잔여일 0 세이브는 0으로 복원된다(30으로 리셋 금지)", () => {
    seedSave(store, { days: 0 });
    const gs = new GameState();
    expect(gs.data.days).toBe(0);
  });

  it("trust가 NaN/문자열/Infinity면 기본값으로 복구된다", () => {
    seedSave(store, { trust: "abc" });
    expect(new GameState().data.trust).toBe(72);
    seedSave(store, { trust: Infinity });
    expect(new GameState().data.trust).toBe(72);
  });
});

describe("P0-2 직원 레벨 상한: 런타임에서도 20을 돌파할 수 없다", () => {
  const staffId = staffDefinitions[0].id;

  it("Lv.20 직원은 단일 채용이 거부된다", () => {
    seedSave(store, { votes: 1e15, explain: 1e15, staff: { [staffId]: 20 } });
    const gs = new GameState();
    expect(gs.hireStaff(staffId)).toBe(false);
    expect(gs.staffLevel(staffId)).toBe(20);
  });

  it("MAX 일괄 채용도 상한 20에서 멈춘다", () => {
    seedSave(store, { votes: 1e15, explain: 1e15, staff: { [staffId]: 18 }, facilities: { desk: 60 } }); // 담당 시설(desk) 레벨이 직원 상한이므로 60으로 둔다
    const gs = new GameState();
    gs.bulkHire(staffId, "max");
    expect(gs.staffLevel(staffId)).toBe(20);
  });
});

describe("P0-4 보상 표 지급 일관성: 구역 진행·누적 통계에 함께 반영", () => {
  it("grantReward는 표를 구역 진행과 누적 표에 함께 반영한다", () => {
    const gs = new GameState();
    const beforeProgress = gs.data.stage.progress;
    const beforeTotal = gs.data.stats.totalVotes;
    gs.grantReward({ votes: 500, explain: 10 });
    expect(gs.data.votes).toBeGreaterThanOrEqual(500);
    expect(gs.data.stage.progress).toBe(Math.min(beforeProgress + 500, gs.data.stage.target));
    expect(gs.data.stats.totalVotes).toBe(beforeTotal + 500);
  });

  it("구역 완료 보상 표가 누적 표 통계에 반영된다", () => {
    const gs = new GameState();
    gs.data.stage.progress = gs.data.stage.target;
    const beforeTotal = gs.data.stats.totalVotes;
    gs.advanceStage();
    expect(gs.data.stats.totalVotes).toBeGreaterThan(beforeTotal);
  });

  it("출석 보상 표가 구역 진행과 누적 표에 반영된다", () => {
    seedSave(store, { daily: { day: 0, streak: 0, qday: 0, clicks: 0, events: 0, upgrades: 0, items: 0, newdex: 0, claimed: {} } });
    const gs = new GameState();
    const beforeTotal = gs.data.stats.totalVotes;
    const beforeProgress = gs.data.stage.progress;
    const r = gs.claimDaily();
    expect(r).not.toBeNull();
    expect(gs.data.stats.totalVotes).toBe(beforeTotal + r.votes);
    expect(gs.data.stage.progress).toBe(Math.min(beforeProgress + r.votes, gs.data.stage.target));
  });
});

describe("P0-3 클라우드 채택: 오프라인 보상 중복·유실 방지", () => {
  it("adoptCloudData는 클라우드 스냅샷 기준으로 오프라인 보상을 재계산하고 로컬에 즉시 저장한다", () => {
    // 로컬: 방금 저장된 상태(오프라인 보상 없음)
    seedSave(store, { votes: 100 });
    const gs = new GameState();
    gs.offlineReward = { elapsed: 999, votes: 12345, explain: 10 }; // 낡은 로컬 보상(중복 지급 후보)
    // 클라우드: 1시간 전 마지막 접속, 더 최신 저장본
    const cloud = { ...gs.data, votes: 777, lastSeenAt: Date.now() - 3600_000, lastSavedAt: Date.now() + 1 };
    gs.adoptCloudData(cloud, Date.now());
    // 낡은 로컬 보상은 폐기되고 클라우드 시점 기준으로 재계산됨
    expect(gs.offlineReward === null || gs.offlineReward.votes !== 12345).toBe(true);
    // 채택 즉시 로컬 저장 — 다음 시작 때 재경합 방지
    const saved = JSON.parse(store.get(SAVE_KEY));
    expect(saved.votes).toBeGreaterThanOrEqual(777);
  });
});
