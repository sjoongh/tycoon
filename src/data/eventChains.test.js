import { describe, expect, it } from "vitest";
import {
  allEventEndings,
  eventChainStepEvent,
  eventChains,
  eventEndingEffectFor,
  resolveEventChainEnding,
} from "./eventChains.js";

describe("사건 체인 데이터", () => {
  it("3개 체인이 각각 3단계와 세 갈래 결말을 갖는다", () => {
    expect(eventChains).toHaveLength(3);
    for (const chain of eventChains) {
      expect(chain.steps).toHaveLength(3);
      expect(Object.keys(chain.endings).sort()).toEqual(["left", "mixed", "right"]);
      for (const [index, step] of chain.steps.entries()) {
        const event = eventChainStepEvent(chain, index);
        expect(event.id).toBe(`chain:${chain.id}:${index}`);
        expect(event.chainStepCount).toBe(3);
        for (const side of [step.left, step.right]) {
          expect(side).toHaveLength(3);
          expect(Object.keys(side[1]).every((key) => ["votes", "explain", "trust"].includes(key))).toBe(true);
        }
      }
    }
  });

  it("체인/결말 id가 모두 고유하고 런 효과 키만 사용한다", () => {
    expect(new Set(eventChains.map((chain) => chain.id)).size).toBe(eventChains.length);
    expect(new Set(allEventEndings.map((ending) => ending.id)).size).toBe(allEventEndings.length);
    const allowed = new Set(["cpsPct", "clickFlat", "explainPct", "eventPct"]);
    for (const ending of allEventEndings) {
      expect(ending.effectText.length).toBeGreaterThan(0);
      expect(Object.keys(ending.effect).every((key) => allowed.has(key))).toBe(true);
    }
  });

  it("세 선택의 극단과 혼합을 서로 다른 결말로 판정한다", () => {
    const chain = eventChains[0];
    expect(resolveEventChainEnding(chain, ["left", "left", "left"]).route).toBe("left");
    expect(resolveEventChainEnding(chain, ["right", "right", "right"]).route).toBe("right");
    expect(resolveEventChainEnding(chain, ["left", "right", "left"]).route).toBe("mixed");
    expect(resolveEventChainEnding(chain, ["left"])).toBeNull();
  });

  it("같은 결말 id는 효과 계산에서 중복 합산하지 않는다", () => {
    const id = allEventEndings[0].id;
    const key = Object.keys(allEventEndings[0].effect)[0];
    expect(eventEndingEffectFor([id, id], key)).toBe(allEventEndings[0].effect[key]);
  });
});
