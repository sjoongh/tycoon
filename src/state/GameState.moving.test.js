import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GameState } from "./GameState.js";
import { clock } from "./clock.js";
import { SAVE_KEY } from "../config.js";
import { MOVE_BOXES, MOVE_BOX_ITEMS, MOVE_GALLERY_MAX, galleryAreas } from "../data/moving.js";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
}
beforeEach(() => installLocalStorage());
afterEach(() => clock.reset());

function newGs() {
  const gs = new GameState();
  gs.checkProgression = () => {};
  return gs;
}

function promote(gs) {
  gs.data.stage.progress = gs.data.stage.target;
  expect(gs.advanceStage()).toBe(true);
}

describe("이삿짐 상자", () => {
  it("새 게임에는 상자가 없고, 구역을 넘으면 3개가 쌓인다", () => {
    const gs = newGs();
    expect(gs.moveBoxesLeft()).toBe(0);
    expect(gs.openMoveBox()).toBeNull();
    promote(gs);
    expect(gs.data.stage.area).toBe(2);
    expect(gs.moveBoxesLeft()).toBe(MOVE_BOXES);
  });

  it("상자를 풀면 표를 주고, 마지막 상자는 해명도 주며 기록을 남긴다", () => {
    const gs = newGs();
    promote(gs);
    const items = [];
    let v0 = gs.data.votes;
    for (let k = 0; k < MOVE_BOXES; k += 1) {
      const e0 = gs.data.explain;
      const r = gs.openMoveBox();
      items.push(r.item);
      expect(r.votes).toBeGreaterThan(0);
      expect(gs.data.votes).toBe(v0 + r.votes);
      v0 = gs.data.votes;
      expect(r.left).toBe(MOVE_BOXES - k - 1);
      if (r.left > 0) expect(r.explain).toBe(0);
      else { expect(r.explain).toBeGreaterThan(0); expect(gs.data.explain).toBe(e0 + r.explain); }
    }
    expect(items).toEqual(MOVE_BOX_ITEMS);
    expect(gs.openMoveBox()).toBeNull();
    expect(gs.data.log.some((l) => String(l).includes("2구역 이삿짐 정리 완료"))).toBe(true);
  });

  it("상자 보상은 현재 생산 15초분과 구역 완료 보상 8% 중 큰 쪽이다", () => {
    const gs = newGs();
    promote(gs);
    gs.cps = () => 1000;
    const floor = Math.floor(gs.stageCompletionVotes(gs.data.stage.area) * 0.08);
    expect(gs.openMoveBox().votes).toBe(Math.max(floor, 15000));
  });

  it("저장 값은 0~3으로 정리되고, 재로드 후에도 남은 상자가 유지된다", () => {
    const gs = newGs();
    promote(gs);
    gs.openMoveBox();
    gs.save(false);
    expect(newGs().moveBoxesLeft()).toBe(MOVE_BOXES - 1);
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    raw.stage.moveBoxes = 99;
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
    expect(newGs().moveBoxesLeft()).toBe(MOVE_BOXES);
    raw.stage.moveBoxes = -2;
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
    expect(newGs().moveBoxesLeft()).toBe(0);
  });

  it("감사(리셋)하면 남은 상자는 사라진다", () => {
    const gs = newGs();
    promote(gs);
    gs.prestigePreview = () => 1;
    gs.medalPreview = () => 0;
    gs.prestigeReset();
    expect(gs.moveBoxesLeft()).toBe(0);
  });
});

describe("지난 지역 액자", () => {
  it("가까운 구역부터 최대 4개를 건다", () => {
    expect(galleryAreas(1)).toEqual([]);
    expect(galleryAreas(2)).toEqual([1]);
    expect(galleryAreas(4)).toEqual([3, 2, 1]);
    expect(galleryAreas(11)).toEqual([10, 9, 8, 7]);
    expect(galleryAreas(30)).toHaveLength(MOVE_GALLERY_MAX);
    expect(galleryAreas("x")).toEqual([]);
  });
});
