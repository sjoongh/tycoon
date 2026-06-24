export const worldMap = {
  floor: { tileKey: "floor/pastel", originX: 195, originY: 470, cols: 5, rows: 6, tileW: 64, tileH: 32 },
  walls: [
    { key: "wall/back-left", x: 120, y: 250 },
    { key: "wall/back-right", x: 270, y: 250 },
  ],
  facilities: {
    desk: {
      anchor: { x: 150, y: 420 },
      workSpots: [
        { x: 120, y: 452 },
        { x: 178, y: 452 },
      ],
      navNode: "desk_front",
    },
  },
  nav: {
    nodes: {
      entrance: { x: 195, y: 560 },
      mid: { x: 195, y: 480 },
      desk_front: { x: 150, y: 462 },
    },
    edges: {
      entrance: ["mid"],
      mid: ["entrance", "desk_front"],
      desk_front: ["mid"],
    },
  },
};
