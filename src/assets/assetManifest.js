import { stationSpriteKey } from "../world/facilityTiers.js";

export const PALETTE = {
  floorA: 0xf7e9cf,
  floorB: 0xefd9b8,
  wall: 0xe7c9a9,
  deskT1: 0xffd9a0,
  deskT2: 0xffc98a,
  deskT3: 0xffb877,
  accent: 0x8ec6a0,
  worker: 0x9ec7ff,
  shadow: 0x000000,
};

export const DESK_TIERS = ["t1", "t2", "t3"];

export const ASSET_KEYS = {
  floor: "floor/pastel",
  walls: ["wall/back-left", "wall/back-right"],
  deskStation: (tier) => stationSpriteKey("desk", tier, "idle"),
  workerSheet: "worker/clerk",
};
