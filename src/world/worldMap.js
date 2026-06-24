export const worldMap = {
  floor: { tileKey: "floor/pastel", originX: 195, originY: 398, cols: 7, rows: 7, tileW: 64, tileH: 32 },
  // 벽 band를 아래로 내려 바닥 뒤쪽과 겹치게(바닥 depth가 위라 벽 하단을 덮어 틈 없이 이어짐)
  room: { key: "room/back", x: 195, y: 296, w: 420, h: 350 },
  walls: [
    { key: "wall/back-left", x: 116, y: 240 },
    { key: "wall/back-right", x: 274, y: 240 },
  ],
  decor: [
    { key: "decor/plant", x: 26, y: 600 },
    { key: "decor/plant", x: 364, y: 600 },
  ],
  facilities: {
    // 뒤(작은 y) -> 앞(큰 y). 좌우로 넓게 펴 겹침 최소화.
    server: { anchor: { x: 138, y: 452 }, workSpots: [{ x: 120, y: 466 }], navNode: "server_front" },
    archive: { anchor: { x: 254, y: 460 }, workSpots: [{ x: 270, y: 474 }], navNode: "archive_front" },
    notice: { anchor: { x: 64, y: 506 }, workSpots: [{ x: 56, y: 520 }], navNode: "notice_front" },
    studio: { anchor: { x: 332, y: 512 }, workSpots: [{ x: 320, y: 526 }], navNode: "studio_front" },
    desk: { anchor: { x: 140, y: 560 }, workSpots: [{ x: 116, y: 572 }, { x: 164, y: 572 }], navNode: "desk_front" },
    sorter: { anchor: { x: 256, y: 566 }, workSpots: [{ x: 236, y: 578 }, { x: 278, y: 578 }], navNode: "sorter_front" },
  },
  nav: {
    nodes: {
      entrance: { x: 195, y: 630 },
      mid: { x: 195, y: 580 },
      server_front: { x: 160, y: 480 },
      archive_front: { x: 278, y: 488 },
      notice_front: { x: 88, y: 532 },
      studio_front: { x: 352, y: 538 },
      desk_front: { x: 168, y: 588 },
      sorter_front: { x: 284, y: 594 },
    },
    edges: {
      entrance: ["mid", "desk_front", "sorter_front"],
      mid: ["entrance", "server_front", "archive_front", "notice_front", "studio_front", "desk_front", "sorter_front"],
      desk_front: ["mid", "entrance", "notice_front"],
      sorter_front: ["mid", "entrance", "studio_front"],
      notice_front: ["mid", "desk_front", "server_front"],
      studio_front: ["mid", "sorter_front", "archive_front"],
      server_front: ["mid", "notice_front", "archive_front"],
      archive_front: ["mid", "server_front", "studio_front"],
    },
  },
};
