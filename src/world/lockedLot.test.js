import { describe, it, expect } from "vitest";
import { lockedPreviewFor, lotLayout, revealStepCount, tilesInRevealStep, LOT_SUM_MAX } from "./lockedLot.js";

describe("잠긴 구획 미리보기", () => {
  it("다음 방 단계와 개방 구역을 알려 준다", () => {
    expect(lockedPreviewFor(1)).toMatchObject({ stage: 0, nextStage: 1, fromLabel: "5×5", label: "7×7", area: 3, remaining: 2 });
    expect(lockedPreviewFor(5)).toMatchObject({ nextStage: 2, label: "9×9", area: 6, remaining: 1 });
    expect(lockedPreviewFor(9)).toMatchObject({ nextStage: 3, label: "11×11", area: 10, remaining: 1 });
  });
  it("최대 단계(10구역~)는 부지가 없다", () => {
    expect(lockedPreviewFor(10)).toBeNull();
    expect(lockedPreviewFor(40)).toBeNull();
  });
  it("잘못된 구역 값은 1구역으로 본다", () => {
    expect(lockedPreviewFor(0).area).toBe(3);
    expect(lockedPreviewFor(NaN).area).toBe(3);
  });
});

describe("부지 배치", () => {
  it("차단봉 4개, 벽 쪽을 뺀 세 변에 테이프", () => {
    const L = lotLayout(3);
    expect(L.posts).toHaveLength(4);
    expect(L.tape).toHaveLength(3);
    expect(L.tape[0][0]).toBe(L.posts[0]);
    expect(L.tape[2][1]).toBe(L.posts[3]);
  });
  it("소품은 부지 안쪽, 가장 먼 차단봉은 화면 예산(i+back) 안", () => {
    for (const sum of [2.45, 2.9, 3.8]) {
      const L = lotLayout(sum);
      const [p0, , p2] = L.posts;
      expect(p2.i + p2.back).toBeCloseTo(sum);
      for (const o of [...L.boxes, L.sign]) {
        expect(o.i).toBeGreaterThan(p0.i);
        expect(o.i).toBeLessThan(p2.i);
        expect(o.back).toBeGreaterThan(p0.back);
        expect(o.back).toBeLessThan(p2.back);
      }
    }
  });
  it("예산 값이 이상하면 범위 안으로 자른다", () => {
    const big = lotLayout(99).posts[2];
    expect(big.i + big.back).toBeCloseTo(LOT_SUM_MAX);
    const bad = lotLayout(NaN).posts[2];
    expect(bad.i + bad.back).toBeGreaterThan(2);
  });
});

describe("확장 연출 행 단위 공개", () => {
  it("모든 타일이 정확히 한 번씩 공개된다", () => {
    for (const n of [5, 7, 9, 11]) {
      const seen = new Set();
      for (let k = 0; k < revealStepCount(n); k += 1) {
        for (const [i, j] of tilesInRevealStep(n, k)) {
          const key = `${i},${j}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }
      expect(seen.size).toBe(n * n);
    }
  });
  it("첫 단계는 뒤 꼭짓점부터", () => {
    expect(tilesInRevealStep(7, 0)).toEqual([[0, 0], [0, 1], [1, 0]]);
  });
});
