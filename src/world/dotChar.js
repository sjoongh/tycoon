// 도트 국장 — 16x16 픽셀 4단계 성장 캐릭터.
// 같은 골격에서 복장/머리/장식만 바뀐다: 넝마 개표원 → 말단 직원 → 정장 국장 → 명예 국장.
// char.html 시안과 동일한 도트맵. 런타임 텍스처(gov-1..4)로 굽는다.

const PAL = {
  ".": null,
  k: 0x14121c,
  s: 0xf1c79b, S: 0xd89c6a,
  h: 0x4a3016, H: 0x6b471f,
  e: 0x15121a,
  r: 0x6b4a2a, R: 0x8a6238,   // 넝마 갈색
  g: 0x8a94a6, G: 0xb3bccc,   // 회색 셔츠
  j: 0x2f3a8c, J: 0x3b5dc9,   // 남색 정장
  t: 0xb13e53,                // 빨강 넥타이
  w: 0xf4f4f4,                // 흰 칼라
  y: 0xffcd75, Y: 0xffd34d,   // 금
  p: 0x7b3fa0, P: 0xa45cc8,   // 망토 보라
  c: 0x73eff7,
};

const STAGE1 = [   // 넝마 개표원
  ".....hhhh.......",
  "...hh.hhhh.h....",
  "..hhhhhhhhhh....",
  "..hhhhhhhhhh....",
  "..hhssssssh.....",
  "..hsssssssss....",
  "..hseSssseSs....",
  "..ssssssssss....",
  "...sssSSsss.....",
  "....ssssss......",
  "...rRrrrrRr.....",
  "..rrrrrrrrrr....",
  "..rRrrrrrrRr....",
  "..rrrrrrrrrr....",
  "..rr.rrrr.rr....",
  "..rr......rr....",
];
const STAGE2 = [   // 말단 직원(회색 셔츠)
  "....hhhhhh......",
  "...hhhhhhhh.....",
  "..hhhhhhhhhh....",
  "..hhssssssh.....",
  "..hsssssssss....",
  "..hseSssseSs....",
  "..ssssssssss....",
  "...sssSSsss.....",
  "....ssssss......",
  "...gggwwggg.....",
  "..gggggggggg....",
  "..ggggkkgggg....",
  "..gggggggggg....",
  "..gggkggkggg....",
  "..gg......gg....",
  "..gg......gg....",
];
const STAGE3 = [   // 정장 국장(남색 + 넥타이 + 배지)
  "....hhhhhh......",
  "...hHhhhhHh.....",
  "..hhhhhhhhhh....",
  "..hhssssssh.....",
  "..hsssssssss....",
  "..hseSssseSs....",
  "..ssssssssss....",
  "...sssSSsss.....",
  "....wwwwww......",
  "..jjjwttwjjj....",
  "..jjjjttjjjj....",
  "..jjJjttjJjjY...",
  "..jjjjjjjjjj....",
  "..jjjjjjjjjj....",
  "..jjj....jjj....",
  "..jj......jj....",
];
const STAGE4 = [   // 명예 국장(금장 + 망토 + 훈장)
  "...YhhhhhhY.....",
  "..hHhhhhhhHh....",
  "..hhhhhhhhhh....",
  "..hhssssssh.....",
  "..hsssssssss....",
  "..hseSssseSs....",
  "..ssssssssss....",
  "...sssSSsss.....",
  ".pPwwwwwwwwPp...",
  ".pjjjwttwjjjp...",
  ".pjjjjttjjjjp...",
  ".pjjYYttYYjjp...",
  ".pjjjjjjjjjjp...",
  "..jjjjjjjjjj....",
  "..jjj....jjj....",
  "..jj......jj....",
];

export const GOV_MAPS = [STAGE1, STAGE2, STAGE3, STAGE4];
export const GOV_SIZE = 16;

// ── 개표소 소품(도트 16x16) ── 국장 주변에 배치해 "개표국" 분위기를 낸다.
const PROP_BALLOTBOX = [
  "................",
  "......kkkk......",   // 투입 중인 용지
  ".....kwwwwk.....",
  ".....kwggwk.....",
  "...kkkkkkkkkk...",   // 윗뚜껑
  "..kJkkkkkkkkJk..",   // 투입구 슬롯(검정)
  "..kJJJJJJJJJJk..",
  "..kJjjjjjjjjJk..",
  "..kJjjjYYjjjJk..",   // 별 ★
  "..kJjjYYYYjjJk..",
  "..kJjjjYYjjjJk..",
  "..kJjjjjjjjjJk..",
  "..kJJJJJJJJJJk..",
  "..kkkkkkkkkkkk..",
  "...k........k...",
  "................",
];
const PROP_PAPERS = [
  "................",
  "................",
  "................",
  ".....kkkkkk.....",
  "....kwwwwwwk.....",
  "....kwggggwk.....",
  "....kwwwwwwk.....",
  "...kkkkkkkkk....",
  "...kwwwwwwwwk...",
  "...kwggggggwk...",
  "...kwwwwwwwwk...",
  "..kkkkkkkkkkk...",
  "..kwwwwwwwwwwk..",
  "..kwggggggggwk..",
  "..kwwwwwwwwwwk..",
  "..kkkkkkkkkkkk..",
];
const PROP_FLAG = [
  "....kk..........",
  "....kktttttk....",
  "....ktwwwwtk....",
  "....kttttttk....",
  "....ktwwwwtk....",
  "....kttttttk....",
  "....kkkkkkk.....",
  "....rr..........",
  "....rr..........",
  "....rr..........",
  "....rr..........",
  "....rr..........",
  "....rr..........",
  "...rrrr.........",
  "..kkkkkkk.......",
  "................",
];

export const PROP_MAPS = {
  "prop-ballotbox": PROP_BALLOTBOX,
  "prop-papers": PROP_PAPERS,
  "prop-flag": PROP_FLAG,
};

// 미니 일꾼(직원) — 흰/회색 실루엣. 런타임에 직원별 색으로 tint한다. 10x10.
const WORKER_MINI = [
  "...wwww...",
  "..wGGGGw..",
  "..GwGwwG..",
  "..wGGGGw..",
  "...wGGw...",
  "..wwwwww..",
  ".wGwwwwGw.",
  ".wwwwwwww.",
  ".ww....ww.",
  ".kk....kk.",
];

// 도트맵 1장을 off-screen graphics로 굽는다.
function bakeTexture(scene, key, map, size = GOV_SIZE) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  for (let y = 0; y < map.length; y++) {
    const row = map[y];
    for (let x = 0; x < row.length; x++) {
      const c = PAL[row[x]];
      if (c == null) continue;
      g.fillStyle(c, 1);
      g.fillRect(x, y, 1, 1);
    }
  }
  g.generateTexture(key, size, size);
  g.destroy();
}

// create() 시점에 1회 호출 — 국장 4단계 텍스처(gov-1..4).
export function buildGovTextures(scene) {
  GOV_MAPS.forEach((map, i) => bakeTexture(scene, `gov-${i + 1}`, map));
}

// 개표소 소품 텍스처(prop-ballotbox / prop-papers / prop-flag).
export function buildPropTextures(scene) {
  Object.entries(PROP_MAPS).forEach(([key, map]) => bakeTexture(scene, key, map));
}

// 미니 일꾼 텍스처(worker-mini, 10x10) — tint로 직원별 색 입힘.
export function buildWorkerTexture(scene) {
  bakeTexture(scene, "worker-mini", WORKER_MINI, 10);
}

// 진행/프레스티지 상태로 국장 성장 단계(1~4) 산정.
export function govStageFor(data) {
  const p = data.prestige || {};
  const runs = p.runs || 0;
  const medals = p.medals || p.totalMedals || 0;
  const area = data.stage?.area || 1;
  let s = 1;
  if (runs >= 1 || area >= 3) s = 2;
  if (runs >= 3 || area >= 5) s = 3;
  if (medals >= 1 || runs >= 6) s = 4;
  return s;
}

export function govTextureKey(data) {
  return `gov-${govStageFor(data)}`;
}
