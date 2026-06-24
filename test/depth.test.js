import { describe, it, expect } from "vitest";
import { stationDepth, workerDepth, fxDepth, DEPTH_BASE } from "../src/world/depth.js";

describe("depth ordering", () => {
  it("places worker above a station at the same y", () => {
    expect(workerDepth(400)).toBeGreaterThan(stationDepth(400));
  });

  it("sorts by y within a layer", () => {
    expect(stationDepth(500)).toBeGreaterThan(stationDepth(300));
  });

  it("keeps fx above world objects", () => {
    expect(fxDepth(0)).toBeGreaterThan(workerDepth(844));
    expect(DEPTH_BASE.fx).toBe(3000);
  });
});
