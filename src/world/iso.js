// 아이소메트릭 방 좌표계 — scripts/art/build_world.py 가 만든 room.png 와 같은 격자.
// 모든 값은 표시(display) px. 소스 px × WORLD_SCALE.
import { WORLD_ATLAS } from "./worldAtlas.js";

export const WORLD_SCALE = WORLD_ATLAS.scale; // 3
export const ROOM_X = 21;   // room.png 좌상단
export const ROOM_Y = 160;
export const ROOM_W = WORLD_ATLAS.room.width * WORLD_SCALE;
export const ROOM_H = WORLD_ATLAS.room.height * WORLD_SCALE;
export const ROOM_BOTTOM = ROOM_Y + ROOM_H;
export const WALL_TOP = ROOM_Y;
export const WALL_BOTTOM = ROOM_Y + WORLD_ATLAS.room.wallH * WORLD_SCALE;

const [TILE_W, TILE_H] = WORLD_ATLAS.tile;
const [TOP_X, TOP_Y] = WORLD_ATLAS.room.top;

// 타일 (i, j) 바닥 중앙. i는 우하향 축(오른쪽 벽을 따라), j는 좌하향 축(왼쪽 벽을 따라).
export function tileCenter(i, j) {
  return {
    x: ROOM_X + (TOP_X + (i - j) * (TILE_W / 2)) * WORLD_SCALE,
    y: ROOM_Y + (TOP_Y + (i + j) * (TILE_H / 2) + TILE_H / 2) * WORLD_SCALE,
  };
}

// 시설 슬롯 — 벽을 따라 뒤쪽, 중앙에 접수창구. 직원은 facing 방향으로 한 타일 앞에 선다.
export const FACILITY_SLOTS = {
  server:  { i: 0, j: 1, workerDx: 1,  workerDy: 0, facing: "left" },
  archive: { i: 0, j: 4, workerDx: 1,  workerDy: 0, facing: "left" },
  notice:  { i: 2, j: 0, workerDx: 0,  workerDy: 1, facing: "right" },
  studio:  { i: 5, j: 0, workerDx: 0,  workerDy: 1, facing: "right" },
  desk:    { i: 3, j: 2, workerDx: 1,  workerDy: 0, facing: "left" },
  sorter:  { i: 6, j: 2, workerDx: -1, workerDy: 1, facing: "right" },
};

export const GOV_TILE = { i: 2, j: 4 };
export const BIG_NUM_TILE = { i: 4, j: 6 }; // 국장 앞 바닥에 큰 숫자

export function facilityPos(id) {
  const s = FACILITY_SLOTS[id];
  return tileCenter(s.i, s.j);
}

export function workerPos(facilityId) {
  const s = FACILITY_SLOTS[facilityId];
  return tileCenter(s.i + s.workerDx, s.j + s.workerDy);
}

// 바닥 다이아몬드 안의 랜덤 지점(아이템·황금 투표함 스폰)
export function randomFloorPoint(margin = 1) {
  const cols = WORLD_ATLAS.roomCols;
  const rows = WORLD_ATLAS.roomRows;
  const i = margin + Math.random() * (cols - margin * 2);
  const j = margin + Math.random() * (rows - margin * 2);
  return tileCenter(i, j);
}

export function facilitySpriteMeta(id, tier) {
  const list = WORLD_ATLAS.facilities[id];
  return list ? list[Math.max(0, Math.min(list.length - 1, tier - 1))] : null;
}
