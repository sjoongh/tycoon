export const worldMap = {
  floor: { tileKey: "floor/pastel", originX: 195, originY: 410, cols: 6, rows: 6, tileW: 70, tileH: 35 },
  room: { key: "room/back", x: 195, y: 250, w: 400, h: 250 },
  walls: [
    { key: "wall/back-left", x: 116, y: 232 },
    { key: "wall/back-right", x: 274, y: 232 },
  ],
  decor: [
    { key: "decor/plant", x: 36, y: 582 },
    { key: "decor/plant", x: 354, y: 582 },
  ],
  facilities: {
    // 뒤(작은 y) -> 앞(큰 y)로 갈수록 앞에 그려짐(depth=1000+y)
    server: { anchor: { x: 150, y: 432 }, workSpots: [{ x: 132, y: 446 }], navNode: "server_front" },
    archive: { anchor: { x: 256, y: 442 }, workSpots: [{ x: 240, y: 456 }], navNode: "archive_front" },
    notice: { anchor: { x: 74, y: 482 }, workSpots: [{ x: 66, y: 496 }], navNode: "notice_front" },
    studio: { anchor: { x: 330, y: 492 }, workSpots: [{ x: 314, y: 506 }], navNode: "studio_front" },
    desk: { anchor: { x: 120, y: 540 }, workSpots: [{ x: 98, y: 552 }, { x: 144, y: 552 }], navNode: "desk_front" },
    sorter: { anchor: { x: 272, y: 548 }, workSpots: [{ x: 252, y: 560 }, { x: 294, y: 560 }], navNode: "sorter_front" },
  },
  nav: {
    nodes: {
      entrance: { x: 195, y: 615 },
      mid: { x: 195, y: 560 },
      server_front: { x: 150, y: 462 },
      archive_front: { x: 256, y: 472 },
      notice_front: { x: 78, y: 510 },
      studio_front: { x: 324, y: 520 },
      desk_front: { x: 120, y: 572 },
      sorter_front: { x: 272, y: 580 },
    },
    edges: {
      entrance: ["mid"],
      mid: ["entrance", "server_front", "archive_front", "notice_front", "studio_front", "desk_front", "sorter_front"],
      server_front: ["mid"],
      archive_front: ["mid"],
      notice_front: ["mid"],
      studio_front: ["mid"],
      desk_front: ["mid"],
      sorter_front: ["mid"],
    },
  },
};
