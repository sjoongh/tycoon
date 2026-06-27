import { describe, it, expect } from "vitest";
import { officeEvents, realEventIds } from "../src/data/events.js";

describe("officeEvents 무결성", () => {
  it("모든 이벤트가 필수 필드를 갖는다", () => {
    for (const e of officeEvents) {
      expect(typeof e.id).toBe("string");
      expect(typeof e.title).toBe("string");
      expect(typeof e.body).toBe("string");
      expect(e.minStage).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(e.left)).toBe(true);
      expect(Array.isArray(e.right)).toBe(true);
      expect(e.left).toHaveLength(3);
      expect(e.right).toHaveLength(3);
      // [라벨, deltas, 힌트]
      expect(typeof e.left[0]).toBe("string");
      expect(typeof e.left[1]).toBe("object");
      expect(typeof e.left[2]).toBe("string");
    }
  });

  it("효과 deltas는 votes/explain/trust 키만 사용한다(applyEffect 호환)", () => {
    const allowed = new Set(["votes", "explain", "trust"]);
    for (const e of officeEvents) {
      for (const side of [e.left, e.right]) {
        for (const k of Object.keys(side[1])) expect(allowed.has(k)).toBe(true);
      }
    }
  });

  it("id는 고유하다", () => {
    const ids = officeEvents.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("realEventIds는 모두 실제 존재하는 이벤트를 가리킨다", () => {
    const ids = new Set(officeEvents.map((e) => e.id));
    for (const r of realEventIds) expect(ids.has(r)).toBe(true);
  });
});
