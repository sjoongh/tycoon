import { beforeEach, describe, expect, it } from "vitest";
import { SAVE_KEY } from "../config.js";
import { eventEndingById } from "../data/eventChains.js";
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

const prepareChain = (gs) => {
  gs.data.stage.area = 4;
  gs.data.stage.target = gs.stageTarget(4);
  gs.data.explain = 10000;
  gs.data.votes = 10000;
  gs.data.eventChain.pity = 2;
};

describe("사건 체인 저장 정규화", () => {
  it("v6 이하 세이브에 빈 런 상태와 영구 결말 도감을 만든다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({ version: 6, lastSeenAt: now, lastSavedAt: now }));
    const gs = new GameState();

    expect(gs.data.version).toBe(10);
    expect(gs.eventChainStatus()).toMatchObject({ active: false, discovered: 0, totalEndings: 9 });
    expect(gs.data.eventChain.effects).toEqual([]);
    expect(gs.data.eventEndings).toEqual({});
  });

  it("손상된 체인·결말 id와 진행 단계를 제거한다", () => {
    const now = Date.now();
    store.set(SAVE_KEY, JSON.stringify({
      version: 9,
      lastSeenAt: now,
      lastSavedAt: now,
      eventEndings: { unknown: 1, "ghost-log-clean-reboot": 3 },
      eventChain: {
        activeId: "ghost-log",
        step: 99,
        choices: ["left", "broken"],
        completed: { unknown: 1 },
        effects: ["ghost-log-clean-reboot", "ghost-log-clean-reboot", "unknown"],
        pity: 99,
      },
    }));
    const gs = new GameState();

    expect(gs.data.eventEndings).toEqual({ "ghost-log-clean-reboot": 1 });
    expect(gs.data.eventChain).toMatchObject({ activeId: "ghost-log", step: 1, choices: ["left"], completed: {}, pity: 2 });
    expect(gs.data.eventChain.effects).toEqual([]);
  });
});

describe("사건 체인 진행과 결말", () => {
  it("일반 사건 두 번 뒤에는 미완료 체인을 보장한다", () => {
    const gs = new GameState();
    prepareChain(gs);
    gs.data.eventChain.pity = 0;

    for (let count = 1; count <= 2; count += 1) {
      const event = gs.pickNextEvent(() => 0.99);
      expect(event.chainId).toBeUndefined();
      expect(gs.resolveEventChoice(event, "left")).toMatchObject({ chain: false });
      expect(gs.data.eventChain.pity).toBe(count);
    }

    const opener = gs.pickNextEvent(() => 0.99);
    expect(opener.chainId).toBeTruthy();
    expect(opener.chainStep).toBe(0);
    expect(gs.data.eventChain.pity).toBe(0);
  });

  it("시작된 체인은 RNG와 무관하게 다음 두 사건으로 이어진다", () => {
    const gs = new GameState();
    prepareChain(gs);
    const first = gs.pickNextEvent(() => 0.99);
    const chainId = first.chainId;

    expect(gs.resolveEventChoice(first, "left").ending).toBeNull();
    const second = gs.pickNextEvent(() => 0);
    expect(second).toMatchObject({ chainId, chainStep: 1 });
    expect(gs.resolveEventChoice(second, "right").ending).toBeNull();
    const third = gs.pickNextEvent(() => 0);
    expect(third).toMatchObject({ chainId, chainStep: 2 });
  });

  it("세 선택 조합을 결말·즉시 보상·런 효과·영구 수집으로 바꾼다", () => {
    const gs = new GameState();
    prepareChain(gs);
    const emitted = [];
    gs.on("event-chain-ending", (result) => emitted.push(result));
    let event = gs.pickNextEvent(() => 0.99);
    const chainId = event.chainId;
    const beforeVotes = gs.data.votes;

    gs.resolveEventChoice(event, "left");
    event = gs.pickNextEvent(() => 0.99);
    gs.resolveEventChoice(event, "right");
    event = gs.pickNextEvent(() => 0.99);
    const result = gs.resolveEventChoice(event, "left");

    expect(result.ending).toMatchObject({ route: "mixed", firstDiscovery: true, discovered: 1, total: 9 });
    expect(result.ending.reward.votes).toBeGreaterThan(0);
    expect(gs.data.votes).toBeGreaterThan(beforeVotes);
    expect(gs.data.eventEndings[result.ending.id]).toBe(1);
    expect(gs.data.eventChain.effects).toEqual([result.ending.id]);
    expect(gs.data.eventChain.completed[chainId]).toBe(1);
    expect(gs.activeEventChain()).toBeNull();
    expect(emitted).toHaveLength(1);
  });

  it("결말 효과는 생산·탭·해명·사건 보상 수식에 실제 반영된다", () => {
    const gs = new GameState();
    const baseline = {
      cps: gs.cpsFor(gs.data),
      click: gs.clickPower(),
      explain: gs.explainPerSecondFor(gs.data),
      event: gs.eventRewardScale(),
    };
    gs.data.eventChain.effects = [
      "thirteenth-box-dawn-express",
      "anonymous-whistle-shield",
      "ghost-log-tamed",
    ];

    expect(gs.eventChainEffectFor(gs.data, "clickFlat")).toBe(2);
    expect(gs.clickPower()).toBe(baseline.click + 2);
    expect(gs.explainPerSecondFor(gs.data)).toBeCloseTo(baseline.explain * 1.18, 6);
    expect(gs.cpsFor(gs.data)).toBeCloseTo(baseline.cps * 1.06, 6);
    expect(gs.eventRewardScale()).toBeCloseTo(baseline.event + 0.12, 6);
  });

  it("진행 중 체인과 런 효과는 저장되며 감사 때 효과만 초기화된다", () => {
    const gs = new GameState();
    prepareChain(gs);
    let event = gs.pickNextEvent(() => 0.99);
    gs.resolveEventChoice(event, "left");
    gs.save(false);

    const restored = new GameState();
    expect(restored.data.eventChain).toMatchObject({ activeId: event.chainId, step: 1, choices: ["left"] });

    for (const side of ["left", "left"]) {
      event = restored.pickNextEvent(() => 0.99);
      restored.resolveEventChoice(event, side);
    }
    const endingId = restored.data.eventChain.effects[0];
    expect(eventEndingById(endingId)).toBeTruthy();
    restored.data.stage.area = 4;
    restored.data.stage.target = restored.stageTarget(4);
    expect(restored.prestigeReset()).toBe(true);
    expect(restored.data.eventEndings[endingId]).toBe(1);
    expect(restored.data.eventChain.effects).toEqual([]);
    expect(restored.data.eventChain.completed).toEqual({});
  });

  it("체제 전복도 결말 도감만 보존하고 런 효과는 지운다", () => {
    const gs = new GameState();
    gs.data.eventEndings["ghost-log-clean-reboot"] = 1;
    gs.data.eventChain.effects = ["ghost-log-clean-reboot"];
    gs.data.eventChain.completed["ghost-log"] = 1;

    expect(gs.communistReset()).toBe(true);
    expect(gs.data.eventEndings["ghost-log-clean-reboot"]).toBe(1);
    expect(gs.data.eventChain.effects).toEqual([]);
    expect(gs.data.eventChain.completed).toEqual({});
  });

  it("자동 비서는 진행 중 체인의 안전 선택을 이어가되 피버 열기는 채우지 않는다", () => {
    const gs = new GameState();
    prepareChain(gs);
    gs.data.prestige.medalUpgrades.autoAide = 1;
    gs.data.eventChain = {
      activeId: "ghost-log",
      step: 0,
      choices: [],
      completed: {},
      effects: [],
      pity: 0,
    };
    gs.data.eventReadyAt = 0;
    const dispatched = [];
    const previousDocument = globalThis.document;
    const previousCustomEvent = globalThis.CustomEvent;
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init?.detail; }
    };
    globalThis.document = { dispatchEvent: (event) => dispatched.push(event) };
    try {
      for (let tick = 0; tick < 8; tick += 1) gs._tickAutoAide();
    } finally {
      globalThis.document = previousDocument;
      globalThis.CustomEvent = previousCustomEvent;
    }

    expect(gs.data.eventChain).toMatchObject({ activeId: "ghost-log", step: 1, choices: ["left"] });
    expect(gs.data.stats.totalEvents).toBe(1);
    expect(gs.feverCharge()).toBe(0);
    expect(dispatched[0]?.detail).toMatchObject({ chain: true });
  });
});
