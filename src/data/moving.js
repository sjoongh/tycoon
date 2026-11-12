// 지역 이주(레퍼런스 로드맵 장기 #3): 구역을 넘으면 새 방에 이삿짐 상자가 쌓이고, 탭해서 하나씩 푼다.
// 감사(prestige)와 별개 — 구역 진행 보상이다. 상자 수는 stage 에 있어 감사 리셋 때 함께 사라진다.

export const MOVE_BOXES = 3;
export const MOVE_BOX_VOTE_SEC = 15; // 상자 하나 = 현재 생산 15초분(최소는 구역 완료 보상의 8%)
export const MOVE_GALLERY_MAX = 4; // 벽에 거는 이전 지역 액자 수

// 상자를 푼 순서대로 나오는 물건(마지막 상자는 해명도 준다)
export const MOVE_BOX_ITEMS = ["옛 명패", "투표함 열쇠 꾸러미", "지난 구역 단체 사진"];

// 벽 액자에 걸 이전 지역 구역 번호(가까운 순)
export function galleryAreas(area) {
  const out = [];
  for (let a = Math.max(1, Number(area) || 1) - 1; a >= 1 && out.length < MOVE_GALLERY_MAX; a -= 1) out.push(a);
  return out;
}
