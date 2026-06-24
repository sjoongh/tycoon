import { describe, it, expect } from "vitest";
import { worldMap } from "../src/world/worldMap.js";
import { findPath } from "../src/world/pathGraph.js";

describe("worldMap", () => {
  it("defines a desk facility with anchor + work spots + nav node", () => {
    const desk = worldMap.facilities.desk;
    expect(desk.anchor).toHaveProperty("x");
    expect(desk.anchor).toHaveProperty("y");
    expect(desk.workSpots.length).toBeGreaterThan(0);
    expect(worldMap.nav.nodes[desk.navNode]).toBeTruthy();
  });

  it("desk nav node is reachable from entrance", () => {
    const desk = worldMap.facilities.desk;
    expect(findPath(worldMap.nav, "entrance", desk.navNode)).not.toBeNull();
  });
});
