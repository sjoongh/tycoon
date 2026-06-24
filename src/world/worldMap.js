export const worldMap = {
  floor: { tileKey: "floor/pastel", originX: 195, originY: 470, cols: 5, rows: 6, tileW: 64, tileH: 32 },
  room: { key: "room/back", x: 195, y: 298 },
  walls: [
    { key: "wall/back-left", x: 132, y: 250 },
    { key: "wall/back-right", x: 258, y: 250 },
  ],
  decor: [
    { key: "decor/plant", x: 52, y: 560 },
    { key: "decor/plant", x: 338, y: 560 },
  ],
  facilities: {
    desk: { anchor: { x: 135, y: 505 }, workSpots: [{ x: 112, y: 518 }, { x: 158, y: 518 }], navNode: "desk_front" },
    sorter: { anchor: { x: 258, y: 525 }, workSpots: [{ x: 238, y: 538 }, { x: 282, y: 538 }], navNode: "sorter_front" },
    notice: { anchor: { x: 72, y: 452 }, workSpots: [{ x: 64, y: 468 }], navNode: "notice_front" },
    server: { anchor: { x: 152, y: 415 }, workSpots: [{ x: 136, y: 430 }], navNode: "server_front" },
    archive: { anchor: { x: 258, y: 420 }, workSpots: [{ x: 242, y: 435 }], navNode: "archive_front" },
    studio: { anchor: { x: 322, y: 478 }, workSpots: [{ x: 308, y: 492 }], navNode: "studio_front" },
  },
  nav: {
    nodes: {
      entrance: { x: 195, y: 580 },
      mid: { x: 195, y: 505 },
      desk_front: { x: 135, y: 540 },
      sorter_front: { x: 258, y: 555 },
      notice_front: { x: 76, y: 486 },
      server_front: { x: 152, y: 450 },
      archive_front: { x: 258, y: 455 },
      studio_front: { x: 318, y: 508 },
    },
    edges: {
      entrance: ["mid"],
      mid: ["entrance", "desk_front", "sorter_front", "notice_front", "server_front", "archive_front", "studio_front"],
      desk_front: ["mid"],
      sorter_front: ["mid"],
      notice_front: ["mid"],
      server_front: ["mid"],
      archive_front: ["mid"],
      studio_front: ["mid"],
    },
  },
};
