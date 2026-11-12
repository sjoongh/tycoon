// 아이소메트릭 방 좌표계 — scripts/art/build_world_ai.py 가 만든 room-*.webp 의 바닥 다이아몬드 실측 기반.
// 모든 값은 표시(display) px. 소스 px × WORLD_SCALE.
// 개표소 확장(중기 #1): 방은 4단계(5×5 → 7×7 → 9×9 → 11×11)로 바뀌고, 이 모듈의 export 는 live binding 이라
// setRoomStage() 뒤에는 모든 import 측에서 새 좌표를 읽는다. 캐릭터·시설 배율(WORLD_SCALE)은 고정 — 방만 바뀐다.
import { WORLD_ATLAS } from "./worldAtlas.js";

export const WORLD_SCALE = WORLD_ATLAS.scale; // 0.58
export const ROOMS = WORLD_ATLAS.rooms || [{ ...WORLD_ATLAS.room, cols: WORLD_ATLAS.roomCols, tile: WORLD_ATLAS.tile, key: "room" }];
export const FLOOR_BOTTOM_Y = 510; // 바닥 앞 꼭짓점 y — 모든 단계에서 고정(시트·FAB 와의 관계 유지)

// 단계별 배치(타일 i: 우하향 축, j: 좌하향 축). 벽을 따라 뒤쪽에 시설, 가운데 접수창구, 그 앞에 국장·표 뭉치·큰 숫자.
const STAGE_LAYOUT = [
  { // 5×5 — 동네 경로당: 접수·분류·공지만 들어간다(전산·보관·브리핑은 3구역 이후 7×7 에서 해금)
    slots: {
      desk:    { i: 2, j: 2, workerDx: 0,  workerDy: 1, facing: "left" },
      sorter:  { i: 4, j: 1, workerDx: -1, workerDy: 1, facing: "right" },
      notice:  { i: 1.2, j: 0, workerDx: 0, workerDy: 1, facing: "right" },
      server:  null, archive: null, studio: null,
    },
    gov: { i: 0.9, j: 3 }, bigNum: { i: 3.4, j: 3.4 }, pile: { i: 2.9, j: 3.1 }, door: { i: 0.3, j: 1.9 }, queue: { i: 1.3, j: 1.4, di: -0.55, dj: -0.1 }, badgeWall: { i: 0, j: 3.0 }, margin: 0.8,
    queueSlots: [[1.3, 1.4], [0.75, 1.3], [1.25, 2.05], [0.7, 1.95]],
    residents: { sorter: { i: 4, j: 2.3 } },
  },
  { // 7×7 — 주민센터/구청(현행)
    slots: {
      server:  { i: 0, j: 1, workerDx: 1,  workerDy: 0, facing: "left" },
      archive: { i: 0, j: 5, workerDx: 1,  workerDy: 0, facing: "left" },
      notice:  { i: 2, j: 0, workerDx: 0,  workerDy: 1, facing: "right" },
      studio:  { i: 5, j: 0, workerDx: 0,  workerDy: 1, facing: "right" },
      desk:    { i: 3, j: 3, workerDx: 1,  workerDy: 0, facing: "left" },
      sorter:  { i: 6, j: 3, workerDx: -1, workerDy: 1, facing: "right" },
    },
    gov: { i: 2, j: 4 }, bigNum: { i: 5.3, j: 5.3 }, pile: { i: 4.6, j: 4.6 }, door: { i: 0.3, j: 2.6 }, queue: { i: 2.3, j: 2.5, di: -0.7, dj: -0.12 }, badgeWall: { i: 0, j: 4.3 }, margin: 1,
    queueSlots: [[2.3, 2.5], [1.6, 2.38], [0.9, 2.26], [1.6, 1.75], [0.9, 1.65]],
    residents: { sorter: { i: 5.9, j: 4.4 }, archive: { i: 1.25, j: 6.1 }, studio: { i: 6.4, j: 2.1 } },
  },
  { // 9×9 — 시청 대강당/도청
    slots: {
      server:  { i: 0, j: 1.5, workerDx: 1,  workerDy: 0, facing: "left" },
      archive: { i: 0, j: 6.5, workerDx: 1,  workerDy: 0, facing: "left" },
      notice:  { i: 2.5, j: 0, workerDx: 0,  workerDy: 1, facing: "right" },
      studio:  { i: 6.5, j: 0, workerDx: 0,  workerDy: 1, facing: "right" },
      desk:    { i: 4, j: 4, workerDx: 1,  workerDy: 0, facing: "left" },
      sorter:  { i: 8, j: 4, workerDx: -1, workerDy: 1, facing: "right" },
    },
    gov: { i: 2.8, j: 5.4 }, bigNum: { i: 6.8, j: 6.8 }, pile: { i: 6, j: 6 }, door: { i: 0.3, j: 4 }, queue: { i: 2.2, j: 2.9, di: -0.75, dj: -0.12 }, badgeWall: { i: 0, j: 5.6 }, margin: 1.2,
    queueSlots: [[2.2, 2.9], [1.45, 2.78], [0.7, 2.66], [1.9, 3.65], [1.15, 3.55], [0.5, 3.45]],
    residents: { sorter: { i: 7.9, j: 5.4 }, archive: { i: 1.25, j: 7.6 }, studio: { i: 7.9, j: 2.2 } },
  },
  { // 11×11 — 중앙개표청 이후
    slots: {
      server:  { i: 0, j: 2, workerDx: 1,  workerDy: 0, facing: "left" },
      archive: { i: 0, j: 8, workerDx: 1,  workerDy: 0, facing: "left" },
      notice:  { i: 3, j: 0, workerDx: 0,  workerDy: 1, facing: "right" },
      studio:  { i: 8, j: 0, workerDx: 0,  workerDy: 1, facing: "right" },
      desk:    { i: 5, j: 5, workerDx: 1,  workerDy: 0, facing: "left" },
      sorter:  { i: 10, j: 5, workerDx: -1, workerDy: 1, facing: "right" },
    },
    gov: { i: 3.6, j: 6.6 }, bigNum: { i: 8.4, j: 8.4 }, pile: { i: 7.4, j: 7.4 }, door: { i: 0.3, j: 5.5 }, queue: { i: 2.6, j: 3.6, di: -0.85, dj: -0.12 }, badgeWall: { i: 0, j: 7 }, margin: 1.5,
    queueSlots: [[2.6, 3.6], [1.75, 3.48], [0.9, 3.36], [2.2, 4.4], [1.35, 4.3], [0.6, 4.2]],
    residents: { sorter: { i: 9.9, j: 6.4 }, archive: { i: 1.25, j: 9.1 }, studio: { i: 9.4, j: 2.3 } },
  },
];

// 구역 → 방 단계. 시설 해금(전산 3·보관 4·브리핑 5구역)과 맞물려 3구역에서 7×7 로 넓어진다.
export function roomStageFor(area) {
  const a = Math.max(1, Number(area) || 1);
  if (a <= 2) return 0;
  if (a <= 5) return 1;
  if (a <= 9) return 2;
  return 3;
}
export const ROOM_STAGE_COUNT = ROOMS.length;
export function nextRoomStageArea(area) {
  const st = roomStageFor(area);
  if (st >= ROOM_STAGE_COUNT - 1) return null;
  return [3, 6, 10][st] || null;
}
export function roomStageLabel(stage) {
  const r = ROOMS[Math.max(0, Math.min(ROOMS.length - 1, stage))];
  return `${r.cols}×${r.cols}`;
}

// ── 현재 단계 상태(live binding) ──
export let ROOM_STAGE = 1;
export let ROOM = ROOMS[1];
export let ROOM_KEY = "room";
export let ROOM_COLS = ROOM.cols;
export let ROOM_W = ROOM.width * WORLD_SCALE;
export let ROOM_H = ROOM.height * WORLD_SCALE;
export let ROOM_X = -7;
export let ROOM_Y = FLOOR_BOTTOM_Y - ROOM_H;
export let ROOM_BOTTOM = FLOOR_BOTTOM_Y;
export let WALL_TOP = ROOM_Y;
export let WALL_BOTTOM = ROOM_Y + ROOM.wallH * WORLD_SCALE;
export let FACILITY_SLOTS = STAGE_LAYOUT[1].slots;
export let GOV_TILE = STAGE_LAYOUT[1].gov;
export let BIG_NUM_TILE = STAGE_LAYOUT[1].bigNum;
export let PILE_TILE = STAGE_LAYOUT[1].pile;
export let DOOR_TILE = STAGE_LAYOUT[1].door;
export let QUEUE = STAGE_LAYOUT[1].queue;
export let BADGE_WALL = STAGE_LAYOUT[1].badgeWall;
export let QUEUE_SLOTS = STAGE_LAYOUT[1].queueSlots; // 방문객 대기 자리(창구에 가까운 칸부터, 두 줄)
export let RESIDENT_SPOTS = STAGE_LAYOUT[1].residents; // 상주 NPC 자리(시설 id → 타일)
let TILE_W = ROOM.tile[0], TILE_H = ROOM.tile[1], TOP_X = ROOM.top[0], TOP_Y = ROOM.top[1], MARGIN = 1;

export function setRoomStage(stage) {
  const st = Math.max(0, Math.min(ROOMS.length - 1, stage | 0));
  ROOM_STAGE = st;
  ROOM = ROOMS[st];
  ROOM_KEY = ROOM.key || "room";
  ROOM_COLS = ROOM.cols;
  ROOM_W = ROOM.width * WORLD_SCALE;
  ROOM_H = ROOM.height * WORLD_SCALE;
  ROOM_X = Math.round((390 - ROOM_W) / 2);
  ROOM_Y = Math.round(FLOOR_BOTTOM_Y - ROOM_H);
  ROOM_BOTTOM = FLOOR_BOTTOM_Y;
  WALL_TOP = ROOM_Y;
  WALL_BOTTOM = ROOM_Y + ROOM.wallH * WORLD_SCALE;
  const L = STAGE_LAYOUT[Math.min(st, STAGE_LAYOUT.length - 1)];
  FACILITY_SLOTS = L.slots;
  GOV_TILE = L.gov; BIG_NUM_TILE = L.bigNum; PILE_TILE = L.pile; DOOR_TILE = L.door; QUEUE = L.queue; BADGE_WALL = L.badgeWall;
  QUEUE_SLOTS = L.queueSlots; RESIDENT_SPOTS = L.residents;
  MARGIN = L.margin;
  [TILE_W, TILE_H] = ROOM.tile;
  [TOP_X, TOP_Y] = ROOM.top;
  return st;
}
setRoomStage(1);

// 타일 (i, j) 바닥 중앙. i는 우하향 축(오른쪽 벽을 따라), j는 좌하향 축(왼쪽 벽을 따라).
export function tileCenter(i, j) {
  return {
    x: ROOM_X + (TOP_X + (i - j) * (TILE_W / 2)) * WORLD_SCALE,
    y: ROOM_Y + (TOP_Y + (i + j) * (TILE_H / 2) + TILE_H / 2) * WORLD_SCALE,
  };
}

// 뒤쪽 왼벽(i=0) 윗선 위의 점 — j 는 왼벽을 따라 0(뒤 꼭짓점) → ROOM_COLS(왼쪽 끝)
export function wallTopPoint(j) {
  const t = tileCenter(0, j);
  return { x: t.x - (TILE_W * WORLD_SCALE) / 4, y: t.y - (TILE_H * WORLD_SCALE) / 4 - ROOM.wallH * WORLD_SCALE };
}

export function facilityPos(id) {
  const s = FACILITY_SLOTS[id];
  if (!s) return null;
  return tileCenter(s.i, s.j);
}

export function workerPos(facilityId) {
  const s = FACILITY_SLOTS[facilityId] || FACILITY_SLOTS.desk;
  return tileCenter(s.i + s.workerDx, s.j + s.workerDy);
}

// 바닥 다이아몬드 안의 랜덤 지점(아이템·황금 투표함 스폰)
export function randomFloorPoint(margin = MARGIN) {
  const n = ROOM_COLS;
  const i = margin + Math.random() * (n - margin * 2);
  const j = margin + Math.random() * (n - margin * 2);
  return tileCenter(i, j);
}

export function facilitySpriteMeta(id, tier) {
  const list = WORLD_ATLAS.facilities[id];
  return list ? list[Math.max(0, Math.min(list.length - 1, tier - 1))] : null;
}
