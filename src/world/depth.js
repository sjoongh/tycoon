export const DEPTH_BASE = { floor: 0, station: 1000, worker: 1000, fx: 3000 };

export function stationDepth(y) {
  return DEPTH_BASE.station + y;
}

export function workerDepth(y) {
  return DEPTH_BASE.worker + y + 20;
}

export function fxDepth(y) {
  return DEPTH_BASE.fx + y;
}
