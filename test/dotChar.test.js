import { describe, it, expect } from "vitest";
import { GOV_MAPS, GOV_SIZE, govStageFor, govTextureKey, dotSvgUri, facilityIconUri } from "../src/world/dotChar.js";

describe("dotChar", () => {
  it("국장 도트맵은 5단계, 각 16x16 정사각", () => {
    expect(GOV_MAPS).toHaveLength(5);
    for (const m of GOV_MAPS) {
      expect(m).toHaveLength(GOV_SIZE);
      for (const row of m) expect(row).toHaveLength(GOV_SIZE);
    }
  });

  it("govStageFor는 진행/프레스티지에 따라 1→4로 상승", () => {
    expect(govStageFor({ prestige: { runs: 0 }, stage: { area: 1 } })).toBe(1);
    expect(govStageFor({ prestige: { runs: 1 }, stage: { area: 1 } })).toBe(2);
    expect(govStageFor({ prestige: { runs: 0 }, stage: { area: 3 } })).toBe(2);
    expect(govStageFor({ prestige: { runs: 3 }, stage: { area: 1 } })).toBe(3);
    expect(govStageFor({ prestige: { runs: 6, medals: 1 }, stage: { area: 1 } })).toBe(4);
  });

  it("govTextureKey는 gov-1..4 형식", () => {
    expect(govTextureKey({ prestige: {}, stage: { area: 1 } })).toMatch(/^gov-[1-4]$/);
  });

  it("dotSvgUri/facilityIconUri는 data-uri 문자열을 반환", () => {
    expect(dotSvgUri(GOV_MAPS[0]).startsWith("data:image/svg+xml,")).toBe(true);
    expect(facilityIconUri("desk").startsWith("data:image/svg+xml,")).toBe(true);
  });
});
