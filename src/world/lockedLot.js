// 잠긴 구획 미리보기(레퍼런스 로드맵 중기 #1 후속) — 다음 방 단계의 증설 부지를 오른쪽 벽 뒤에 펼쳐 둔다.
// 부지 좌표는 (i, back): i 는 오른벽을 따라(0 = 뒤 꼭짓점), back 은 벽에서 바깥으로 떨어진 타일 수.
import { roomStageFor, nextRoomStageArea, roomStageLabel, ROOM_STAGE_COUNT } from "./iso.js";

// 부지 크기는 화면 예산으로 정한다: 오른쪽 위 HUD 칩(오늘의 접수·생산 2배) 왼쪽에 들어오게 i+back 합의 상한을 받는다.
export const LOT_SUM_MIN = 2.2;
export const LOT_SUM_MAX = 4;

// 다음 확장 정보. 최대 단계면 null(부지를 그리지 않는다).
export function lockedPreviewFor(area) {
  const a = Math.max(1, Number(area) || 1);
  const stage = roomStageFor(a);
  const at = nextRoomStageArea(a);
  if (at == null || stage >= ROOM_STAGE_COUNT - 1) return null;
  return { stage, nextStage: stage + 1, fromLabel: roomStageLabel(stage), label: roomStageLabel(stage + 1), area: at, remaining: Math.max(0, at - a) };
}

// 부지 배치: 바닥 사각형·차단봉 4개·테이프 3구간(벽 쪽 한 변은 열려 있다)·소품.
// sumMax = 가장 먼 차단봉(i1, b1)의 i+back 상한(화면 x 예산 ÷ 반 타일 폭).
export function lotLayout(sumMax = 3) {
  const sum = Math.min(LOT_SUM_MAX, Math.max(LOT_SUM_MIN, Number(sumMax) || LOT_SUM_MIN));
  const i0 = 0.25, b0 = 0.25;
  const b1 = sum * 0.42, i1 = sum - b1;
  const at = (u, v) => ({ i: i0 + (i1 - i0) * u, back: b0 + (b1 - b0) * v });
  const posts = [at(0, 0), at(0, 1), at(1, 1), at(1, 0)];
  return {
    ground: [{ i: 0.08, back: 0.05 }, { i: 0.08, back: b1 + 0.12 }, { i: i1 + 0.12, back: b1 + 0.12 }, { i: i1 + 0.12, back: 0.05 }],
    posts,
    tape: [[posts[0], posts[1]], [posts[1], posts[2]], [posts[2], posts[3]]],
    boxes: [{ ...at(0.12, 0.2), scale: 1 }, { ...at(0.92, 0.12), scale: 0.85 }],
    sign: at(0.55, 0.62),
  };
}

// 확장 연출: 바닥을 화면 위 → 아래로 타일 행 단위로 드러낸다. 한 단계 = i+j 가 2k, 2k+1 인 두 줄.
export const REVEAL_STAGGER_MS = 60;
export function revealStepCount(cols) {
  return Math.max(1, cols | 0);
}
export function tilesInRevealStep(cols, k) {
  const out = [];
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const s = i + j;
      if (s === 2 * k || s === 2 * k + 1) out.push([i, j]);
    }
  }
  return out;
}
