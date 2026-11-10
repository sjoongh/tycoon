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

describe("#11 평생 통계(lifetime)와 런 통계(stats) 분리", () => {
  function prestigeReady(gs) {
    gs.data.stage.area = 8;
    gs.data.prestige.bestArea = 8;
    gs.data.facilities.desk = 30;
    return gs;
  }

  it("감사(프레스티지) 뒤 런 통계는 리셋되지만 lifetimeStat은 누적을 유지한다", () => {
    const gs = prestigeReady(rich(new GameState()));
    gs.data.stats.totalVotes = 5000;
    gs.data.stats.totalClicks = 120;
    gs.data.stats.totalEvents = 9;
    expect(gs.lifetimeStat("totalVotes")).toBe(5000);
    expect(gs.canPrestige()).toBe(true);
    expect(gs.prestigeReset()).toBe(true);
    expect(gs.data.stats.totalVotes).toBe(0);
    expect(gs.lifetimeStat("totalVotes")).toBe(5000);
    expect(gs.lifetimeStat("totalClicks")).toBe(120);
    expect(gs.lifetimeStat("totalEvents")).toBe(9);
    gs.data.stats.totalVotes = 100;
    expect(gs.lifetimeStat("totalVotes")).toBe(5100);
  });

  it("업적 metric(totalVotes·totalClicks·totalEvents·totalItems·ciders)은 lifetime을 읽고, 주간 목표·감사 미리보기는 런 통계를 쓴다", () => {
    const gs = prestigeReady(rich(new GameState()));
    gs.data.stats.totalVotes = 900;
    gs.data.stats.totalEvents = 6;
    gs.prestigeReset();
    gs.weeklyProgress(); // 주차 초기화(기준점 고정) 뒤 이번 런 득표를 쌓는다
    gs.data.stats.totalVotes = 200;
    expect(gs.achievementProgress("totalVotes")).toBe(1100);
    expect(gs.achievementProgress("totalEvents")).toBe(6);
    // 주간 목표 진행은 런 기준점(baseVotes) 대비 — 감사 직후 0에서 다시 센다
    expect(gs.weeklyProgress()).toBe(200);
    // 감사 미리보기는 이번 런의 사건 수만 반영한다(0건 → eventValue 0)
    prestigeReady(gs);
    const withoutEvents = gs.prestigePreview();
    gs.data.stats.totalEvents = 3;
    expect(gs.prestigePreview()).toBeGreaterThanOrEqual(withoutEvents);
  });

  it("lifetime이 없는 예전 세이브는 현재 런 통계를 그대로 평생 통계로 본다(회귀 없음)", () => {
    const base = new GameState();
    const data = { ...base.data, stats: { ...base.data.stats, totalVotes: 777 }, lastSeenAt: Date.now(), lastSavedAt: Date.now() };
    delete data.lifetime;
    store.set(SAVE_KEY, JSON.stringify(data));
    const gs = new GameState();
    expect(gs.lifetimeStat("totalVotes")).toBe(777);
    expect(gs.data.lifetime).toBeTruthy();
  });

  it("손상된 lifetime 값(NaN·음수·문자열)은 0으로 정규화된다", () => {
    const base = new GameState();
    store.set(SAVE_KEY, JSON.stringify({ ...base.data, lifetime: { totalVotes: "abc", totalClicks: -5, totalEvents: null }, lastSeenAt: Date.now(), lastSavedAt: Date.now() }));
    const gs = new GameState();
    expect(gs.data.lifetime.totalVotes).toBe(0);
    expect(gs.data.lifetime.totalClicks).toBe(0);
    expect(gs.lifetimeStat("totalEvents")).toBe(0);
  });
});

describe("#6 업그레이드 회수 시간 — 실제 초당 증가량 기반", () => {
  it("upgradeGain은 레벨 1 증가 시 cps 실증가량이고, payback은 비용/증가량(초)이다", () => {
    const gs = rich(new GameState());
    const before = gs.cps();
    const gain = gs.upgradeGain("desk");
    expect(gain).toBeGreaterThan(0);
    const payback = gs.upgradePaybackSeconds("desk");
    expect(payback).toBeCloseTo(gs.cost("desk") / gain, 6);
    gs.upgrade("desk");
    expect(gs.cps() - before).toBeCloseTo(gain, 6);
  });

  it("잠긴 시설·최대 레벨은 null을 돌려준다", () => {
    const gs = rich(new GameState());
    expect(gs.upgradePaybackSeconds("studio")).toBe(null); // 선행 조건 미충족
    gs.data.facilities.desk = 60; // maxLevel
    expect(gs.upgradePaybackSeconds("desk")).toBe(null);
  });

  it("formatDuration은 초를 사람이 읽는 한국어로 줄인다", async () => {
    const { formatDuration } = await import("../utils/format.js");
    expect(formatDuration(0.4)).toBe("1초 미만");
    expect(formatDuration(42)).toBe("42초");
    expect(formatDuration(95)).toBe("1분 35초");
    expect(formatDuration(3600 * 2 + 60 * 5)).toBe("2시간 5분");
    expect(formatDuration(86400 * 3 + 3600 * 4)).toBe("3일 4시간");
    expect(formatDuration(Infinity)).toBe("∞");
  });

  it("rateNumber는 작은 초당 값을 0으로 뭉개지 않는다", async () => {
    const { rateNumber } = await import("../utils/format.js");
    expect(rateNumber(0.33)).toBe("0.33");
    expect(rateNumber(0.3)).toBe("0.3");
    expect(rateNumber(12.34)).toBe("12.3");
    expect(rateNumber(250.6)).toBe("251");
    expect(rateNumber(0)).toBe("0");
  });
});
