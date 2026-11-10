// 개선 로드맵 4차(#14 온보딩 상태머신)·3차(#17 시설 마일스톤) 회귀 테스트.
import { describe, it, expect, beforeEach } from "vitest";
import { GameState } from "./GameState.js";
import { SAVE_KEY } from "../config.js";
import { facilities } from "../data/facilities.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  return store;
}

function rich(gs) {
  gs.data.votes = 1e12;
  gs.data.explain = 1e12;
  return gs;
}

let store;
beforeEach(() => { store = installLocalStorage(); });

describe("#14 온보딩: 튜토리얼 단계는 통계에서 파생되고 순서에 묶이지 않는다", () => {
  it("순서를 바꿔도(채용→업그레이드→탭) 단계가 모두 집계된다", () => {
    const gs = rich(new GameState());
    expect(gs.tutorialNextStep()).toBe("click");
    expect(gs.hireStaff("clerk")).toBe(true);
    expect(gs.upgrade("desk")).toBe(true);
    gs.processClick(100, 100);
    const p = gs.tutorialProgress();
    expect(p.click).toBe(true);
    expect(p.upgrade).toBe(true);
    expect(p.staff).toBe(true);
    expect(p.event).toBe(false);
    expect(gs.data.tutorial.step).toBe(3);
    expect(gs.data.tutorial.done).toBe(false);
  });

  it("사건 대응 뒤에도 첫 구역 돌파 전까지는 'stage' 힌트가 남고, 돌파하면 완료 보상이 1회만 지급된다", () => {
    const gs = rich(new GameState());
    gs.hireStaff("clerk");
    gs.upgrade("desk");
    gs.processClick(100, 100);
    gs.applyEffect({ votes: 10 }, { fever: false });
    expect(gs.tutorialNextStep()).toBe("stage");
    expect(gs.data.tutorial.done).toBe(false);

    gs.data.stage.progress = gs.data.stage.target;
    const explainBefore = gs.data.explain;
    expect(gs.advanceStage()).toBe(true);
    expect(gs.data.tutorial.done).toBe(true);
    expect(gs.tutorialNextStep()).toBe(null);
    expect(gs.data.explain - explainBefore).toBeGreaterThanOrEqual(30);

    // 이미 완료 — 다시 동기화해도 보상 중복 없음(탭 자체의 해명 수입과 분리해 직접 호출로 검사)
    const again = gs.data.explain;
    gs.advanceTutorial();
    gs.advanceTutorial();
    expect(gs.data.explain).toBe(again);
  });

  it("예전 세이브(step 5·done true)는 그대로 완료 상태를 유지한다", () => {
    const base = new GameState();
    store.set(SAVE_KEY, JSON.stringify({ ...base.data, tutorial: { step: 5, done: true, openingSeen: true }, lastSeenAt: Date.now(), lastSavedAt: Date.now() }));
    const gs = new GameState();
    expect(gs.data.tutorial.done).toBe(true);
    expect(gs.tutorialNextStep()).toBe(null);
    const explain = gs.data.explain;
    gs.processClick(100, 100);
    expect(gs.data.explain).toBe(explain);
  });

  it("통계상 이미 전부 끝낸 예전 세이브는 다음 동기화 때 완료로 승격되고 보상은 1회만", () => {
    const base = rich(new GameState());
    base.data.stats.totalClicks = 50;
    base.data.stats.totalUpgrades = 3;
    base.data.stats.totalEvents = 2;
    base.data.staff.clerk = 1;
    base.data.stage.completed = 2;
    store.set(SAVE_KEY, JSON.stringify({ ...base.data, tutorial: { step: 1, done: false }, lastSeenAt: Date.now(), lastSavedAt: Date.now() }));
    const gs = new GameState();
    const explain = gs.data.explain;
    gs.processClick(100, 100);
    expect(gs.data.tutorial.done).toBe(true);
    expect(gs.data.explain - explain).toBeGreaterThanOrEqual(30);
    const after = gs.data.explain;
    gs.processClick(100, 100);
    expect(gs.data.explain).toBe(after);
  });
});

describe("#17 시설 마일스톤: 시설별 상한을 넘는 마일스톤은 존재하지 않는다", () => {
  it("nextFacilityMilestone은 어떤 시설·레벨에서도 maxLevel을 넘는 값을 돌려주지 않는다", () => {
    const gs = new GameState();
    for (const f of facilities) {
      for (let lv = 0; lv <= f.maxLevel; lv += 1) {
        const next = gs.nextFacilityMilestone(lv, f.id);
        if (next != null) {
          expect(next).toBeGreaterThan(lv);
          expect(next).toBeLessThanOrEqual(f.maxLevel);
        }
      }
    }
  });

  it("도달 가능한 마일스톤(25/50)의 배율은 기존과 같다 — 밸런스 보존", () => {
    const gs = new GameState();
    expect(gs.facilityMilestoneFactor(24, "desk")).toBe(1);
    expect(gs.facilityMilestoneFactor(25, "desk")).toBe(2);
    expect(gs.facilityMilestoneFactor(50, "desk")).toBe(4);
    expect(gs.facilityMilestoneFactor(60, "desk")).toBe(4);
    // studio(max 35)는 25만 도달 가능
    expect(gs.facilityMilestoneFactor(35, "studio")).toBe(2);
    expect(gs.nextFacilityMilestone(25, "studio")).toBe(null);
    expect(gs.nextFacilityMilestone(10, "studio")).toBe(25);
  });

  it("시설 데이터의 milestones 필드가 있으면 그것을 우선 사용한다", () => {
    const gs = new GameState();
    const custom = { id: "x", maxLevel: 30, milestones: [10, 20, 40] };
    expect(gs.facilityMilestones(custom)).toEqual([10, 20]);
    expect(gs.nextFacilityMilestone(15, custom)).toBe(20);
    expect(gs.facilityMilestoneFactor(20, custom)).toBe(4);
  });
});
