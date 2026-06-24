import { PALETTE, ASSET_KEYS, DESK_TIERS } from "../assets/assetManifest.js";

function isoDiamond(g, cx, cy, w, h, color) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(cx, cy - h / 2);
  g.lineTo(cx + w / 2, cy);
  g.lineTo(cx, cy + h / 2);
  g.lineTo(cx - w / 2, cy);
  g.closePath();
  g.fillPath();
}

function makeFloorTile(scene) {
  if (scene.textures.exists(ASSET_KEYS.floor)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  isoDiamond(g, 32, 16, 64, 32, PALETTE.floorA);
  g.lineStyle(2, PALETTE.floorB, 1);
  g.strokePath();
  g.generateTexture(ASSET_KEYS.floor, 64, 32);
  g.destroy();
}

function makeWall(scene, key, color) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(color, 1);
  g.fillRoundedRect(0, 0, 60, 70, 6);
  g.generateTexture(key, 60, 70);
  g.destroy();
}

// 티어별로 폭/높이/장식이 달라 실루엣이 구분된다
const DESK_SHAPE = {
  t1: { w: 46, h: 30, color: PALETTE.deskT1, posts: 0 },
  t2: { w: 66, h: 40, color: PALETTE.deskT2, posts: 1 },
  t3: { w: 84, h: 52, color: PALETTE.deskT3, posts: 2 },
};

function makeDeskTier(scene, tier) {
  if (scene.textures.exists(ASSET_KEYS.deskStation(tier))) return;
  const s = DESK_SHAPE[tier];
  const W = 96;
  const H = 80;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // 그림자
  g.fillStyle(PALETTE.shadow, 0.15);
  g.fillEllipse(W / 2, H - 8, s.w + 12, 14);
  // 카운터 본체
  g.fillStyle(s.color, 1);
  g.fillRoundedRect((W - s.w) / 2, H - s.h - 8, s.w, s.h, 6);
  // 상판 하이라이트
  g.fillStyle(0xffffff, 0.35);
  g.fillRoundedRect((W - s.w) / 2 + 4, H - s.h - 4, s.w - 8, 6, 3);
  // 대기줄 기둥(티어 상승 표시)
  g.fillStyle(PALETTE.accent, 1);
  for (let i = 0; i < s.posts; i++) {
    g.fillCircle((W - s.w) / 2 - 6, H - 14 - i * 12, 4);
  }
  g.generateTexture(ASSET_KEYS.deskStation(tier), W, H);
  g.destroy();
}

// 워커: 4프레임 가로 스프라이트시트(walk 2 + idle 1 + work 1)
function makeWorkerSheet(scene) {
  if (scene.textures.exists(ASSET_KEYS.workerSheet)) return;
  const FW = 24;
  const FH = 32;
  const frames = 4;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  for (let f = 0; f < frames; f++) {
    const ox = f * FW;
    const legShift = f === 1 ? 2 : 0;
    g.fillStyle(PALETTE.shadow, 0.15);
    g.fillEllipse(ox + FW / 2, FH - 3, 16, 5);
    // 다리
    g.fillStyle(0x6b5b7a, 1);
    g.fillRect(ox + 8 - legShift, 22, 3, 7);
    g.fillRect(ox + 13 + legShift, 22, 3, 7);
    // 몸통
    g.fillStyle(PALETTE.worker, 1);
    g.fillRoundedRect(ox + 6, 13, 12, 11, 3);
    // 머리
    g.fillStyle(0xfff1d8, 1);
    g.fillCircle(ox + 12, 8, 5);
    // work 프레임(마지막)엔 팔 든 모션
    if (f === 3) {
      g.fillStyle(PALETTE.worker, 1);
      g.fillRect(ox + 17, 10, 3, 7);
    }
  }
  g.generateTexture(ASSET_KEYS.workerSheet, FW * frames, FH);
  g.destroy();
}

// 투표용지: BallotPool이 "ballot" 키를 참조한다 (createPixelTextures 은퇴 후 필요)
function makeBallot(scene) {
  if (scene.textures.exists("ballot")) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xfff9ef, 1);
  g.fillRoundedRect(0, 0, 22, 14, 3);
  g.lineStyle(2, PALETTE.deskT3, 1);
  g.strokeRoundedRect(1, 1, 20, 12, 3);
  g.fillStyle(PALETTE.accent, 1);
  g.fillRect(5, 6, 12, 2);
  g.generateTexture("ballot", 22, 14);
  g.destroy();
}

export function generatePlaceholders(scene) {
  makeFloorTile(scene);
  ASSET_KEYS.walls.forEach((key) => makeWall(scene, key, PALETTE.wall));
  DESK_TIERS.forEach((tier) => makeDeskTier(scene, tier));
  makeWorkerSheet(scene);
  makeBallot(scene);
}
