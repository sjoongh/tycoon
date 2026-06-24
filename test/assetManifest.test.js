import { describe, it, expect } from "vitest";
import { ASSET_KEYS } from "../src/assets/assetManifest.js";

describe("assetManifest", () => {
  it("derives desk station keys per tier", () => {
    expect(ASSET_KEYS.deskStation("t1")).toBe("facility/desk/t1/idle");
    expect(ASSET_KEYS.deskStation("t3")).toBe("facility/desk/t3/idle");
  });
});
