import { describe, it, expect } from "vitest";
import { tierForLevel, stationSpriteKey } from "../src/world/facilityTiers.js";

describe("tierForLevel", () => {
  it("maps level boundaries to tiers", () => {
    expect(tierForLevel(0)).toBe("locked");
    expect(tierForLevel(1)).toBe("t1");
    expect(tierForLevel(4)).toBe("t1");
    expect(tierForLevel(5)).toBe("t2");
    expect(tierForLevel(11)).toBe("t2");
    expect(tierForLevel(12)).toBe("t3");
    expect(tierForLevel(25)).toBe("t4");
    expect(tierForLevel(45)).toBe("t5");
    expect(tierForLevel(999)).toBe("t5");
  });

  it("clamps invalid input to locked", () => {
    expect(tierForLevel(-3)).toBe("locked");
    expect(tierForLevel(undefined)).toBe("locked");
    expect(tierForLevel(2.9)).toBe("t1");
  });
});

describe("stationSpriteKey", () => {
  it("builds a namespaced key", () => {
    expect(stationSpriteKey("desk", "t2")).toBe("facility/desk/t2/idle");
    expect(stationSpriteKey("desk", "t3", "work")).toBe("facility/desk/t3/work");
  });
});
