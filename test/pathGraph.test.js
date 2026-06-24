import { describe, it, expect } from "vitest";
import { findPath } from "../src/world/pathGraph.js";

const graph = {
  edges: {
    entrance: ["mid"],
    mid: ["entrance", "desk_front", "sorter_front"],
    desk_front: ["mid"],
    sorter_front: ["mid"],
  },
};

describe("findPath", () => {
  it("finds a route across nodes", () => {
    expect(findPath(graph, "entrance", "desk_front")).toEqual(["entrance", "mid", "desk_front"]);
  });

  it("returns single node when start === goal", () => {
    expect(findPath(graph, "mid", "mid")).toEqual(["mid"]);
  });

  it("returns null when unreachable", () => {
    expect(findPath(graph, "entrance", "nowhere")).toBeNull();
  });
});
