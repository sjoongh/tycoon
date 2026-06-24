import { PALETTE, ASSET_KEYS, DESK_TIERS } from "../assets/assetManifest.js";
import { facilities } from "../data/facilities.js";

const FAC_TIER_W = { t1: 58, t2: 70, t3: 82, t4: 92, t5: 100 };

// 비-desk 시설의 임시 스프라이트(시설색 블록, 티어별 크기). 실제 아트가 같은 키로 로드되면 자동으로 안 만들어짐.
function makeFacilityTier(scene, facilityId, color, tier) {
  const key = `facility/${facilityId}/${tier}/idle`;
  if (scene.textures.exists(key)) return;
  const w = FAC_TIER_W[tier];
  const h = Math.round(w * 0.72);
  const W = 112;
  const H = 96;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(PALETTE.shadow, 0.15);
  g.fillEllipse(W / 2, H - 8, w + 12, 13);
  g.fillStyle(color, 1);
  g.fillRoundedRect((W - w) / 2, H - h - 8, w, h, 8);
  g.fillStyle(0xffffff, 0.3);
  g.fillRoundedRect((W - w) / 2 + 4, H - h - 4, w - 8, 6, 3);
  g.fillStyle(0x000000, 0.12);
  g.fillRoundedRect((W - w) / 2, H - 16, w, 8, 3);
  g.generateTexture(key, W, H);
  g.destroy();
}

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

// 방 뒤 벽 패널: 다크 보이드를 없애고 따뜻한 실내 느낌을 준다
function makeRoomBack(scene) {
  if (scene.textures.exists("room/back")) return;
  const W = 400;
  const H = 320;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // 벽
  g.fillStyle(0xf3e3bf, 1);
  g.fillRoundedRect(0, 0, W, H, 24);
  // 윗쪽 부드러운 하이라이트
  g.fillStyle(0xfff3d6, 0.5);
  g.fillRoundedRect(0, 0, W, 70, 24);
  // 걸레받이(벽-바닥 경계)
  g.fillStyle(0xe6cf9f, 1);
  g.fillRect(0, H - 26, W, 26);
  g.generateTexture("room/back", W, H);
  g.destroy();
}

// 벽 장식 = 창문 (떠 있던 카드 대체)
function makeWindow(scene, key) {
  if (scene.textures.exists(key)) return;
  const W = 64;
  const H = 76;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // 창틀
  g.fillStyle(0xfff7e6, 1);
  g.fillRoundedRect(0, 0, W, H, 8);
  // 하늘
  g.fillStyle(0xbfe3ff, 1);
  g.fillRoundedRect(6, 6, W - 12, H - 12, 5);
  // 구름
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(22, 28, 7);
  g.fillCircle(32, 28, 9);
  // 창살
  g.fillStyle(0xfff7e6, 1);
  g.fillRect(W / 2 - 2, 6, 4, H - 12);
  g.fillRect(6, H / 2 - 2, W - 12, 4);
  g.generateTexture(key, W, H);
  g.destroy();
}

// 화분 데코
function makePlant(scene) {
  if (scene.textures.exists("decor/plant")) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(PALETTE.shadow, 0.15);
  g.fillEllipse(20, 50, 30, 8);
  // 화분
  g.fillStyle(0xe89f6b, 1);
  g.fillRoundedRect(10, 36, 20, 16, 4);
  // 잎
  g.fillStyle(0x8ec6a0, 1);
  g.fillCircle(20, 24, 11);
  g.fillCircle(12, 30, 8);
  g.fillCircle(28, 30, 8);
  g.fillStyle(0xa9d9b8, 0.7);
  g.fillCircle(20, 20, 6);
  g.generateTexture("decor/plant", 40, 54);
  g.destroy();
}

// 티어별로 폭/높이/장식이 달라 실루엣이 구분된다
const DESK_SHAPE = {
  t1: { w: 46, h: 30, color: PALETTE.deskT1, posts: 0 },
  t2: { w: 66, h: 40, color: PALETTE.deskT2, posts: 1 },
  t3: { w: 84, h: 52, color: PALETTE.deskT3, posts: 2 },
  t4: { w: 92, h: 60, color: PALETTE.deskT4, posts: 3 },
  t5: { w: 96, h: 68, color: PALETTE.deskT5, posts: 4 },
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
  makeRoomBack(scene);
  makeFloorTile(scene);
  ASSET_KEYS.walls.forEach((key) => makeWindow(scene, key));
  makePlant(scene);
  DESK_TIERS.forEach((tier) => makeDeskTier(scene, tier));
  facilities
    .filter((f) => f.id !== "desk")
    .forEach((f) => ["t1", "t2", "t3", "t4", "t5"].forEach((tier) => makeFacilityTier(scene, f.id, f.color, tier)));
  makeWorkerSheet(scene);
  makeBallot(scene);
}
