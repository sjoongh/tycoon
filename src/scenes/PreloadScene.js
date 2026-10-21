import Phaser from "phaser";
import { applyRenderScale } from "../world/renderScale.js";
import { generatePlaceholders } from "../textures/devPlaceholders.js";
import { buildGovTextures, buildPropTextures, buildWorkerTexture, buildCosmeticTextures } from "../world/dotChar.js";
import { loadIconSheets, registerIconFrames } from "../assets/iconTextures.js";
import { WORLD_ATLAS, facilitySpriteKey, govSpriteKey, workerSpriteKey } from "../world/worldAtlas.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    applyRenderScale(this);
    // 로딩 스크린(진행바) — 무거운 초기 에셋 로드 동안 검은화면/탭유실 방지
    const W = 390;
    const H = 844;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1b2244);
    this.add.text(W / 2, H / 2 - 46, "믿어주세요 개표국", {
      fontFamily: '"Jua", system-ui, sans-serif', fontSize: "24px", color: "#ffe1a6",
    }).setOrigin(0.5);
    const pct = this.add.text(W / 2, H / 2 + 40, "0%", {
      fontFamily: "system-ui, sans-serif", fontSize: "13px", color: "#c9b9a8",
    }).setOrigin(0.5);
    this.add.rectangle(W / 2, H / 2, 248, 18, 0x000000, 0.35).setStrokeStyle(2, 0xffffff, 0.25);
    const bar = this.add.rectangle(W / 2 - 121, H / 2, 0, 11, 0xffc14d).setOrigin(0, 0.5);
    this.load.on("progress", (v) => { bar.width = 242 * v; pct.setText(`${Math.round(v * 100)}%`); });

    // 픽셀 리빌드 후 실제 사용하는 아트만 로드(나머지 이소 오피스 webp는 미사용 — 제거).
    //  · decor/ballotbox: 필드 황금 투표함  · ballot: 투표용지 파티클(BallotPool)
    this.load.image("decor/ballotbox", "/art/ballotbox.webp");
    this.load.image("ballot", "/art/ballot.webp");
    loadIconSheets(this); // 아이콘 아틀라스(DOM과 공용)
    // 아이소 개표소 월드(scripts/art/build_world.py 산출물)
    this.load.image("world/room", "/art/world/room.png");
    for (const id of Object.keys(WORLD_ATLAS.facilities)) {
      for (let t = 1; t <= WORLD_ATLAS.facilities[id].length; t += 1) {
        this.load.image(facilitySpriteKey(id, t), `/art/world/fac-${id}-t${t}.png`);
      }
    }
    for (let g = 1; g <= WORLD_ATLAS.gov.length; g += 1) this.load.image(govSpriteKey(g), `/art/world/gov-${g}.png`);
    for (let v = 0; v < WORLD_ATLAS.workers.variants; v += 1) {
      for (let f = 0; f < WORLD_ATLAS.workers.frames; f += 1) this.load.image(workerSpriteKey(v, f), `/art/world/worker-${v}-${f}.png`);
    }
    this.load.image("world/ballot", "/art/world/ballot.png");
    for (const cid of Object.keys(WORLD_ATLAS.cosmetics || {})) this.load.image(`world/${cid}`, `/art/world/${cid}.png`);
  }

  create() {
    registerIconFrames(this);
    // 직원 타이핑 루프(2프레임) — 변형별
    for (let v = 0; v < WORLD_ATLAS.workers.variants; v += 1) {
      const key = `worker-type-${v}`;
      if (!this.anims.exists(key)) {
        this.anims.create({ key, frames: Array.from({ length: WORLD_ATLAS.workers.frames }, (_, f) => ({ key: workerSpriteKey(v, f) })), frameRate: 3, repeat: -1 });
      }
    }
    generatePlaceholders(this); // ballot 폴백 등 안전망(존재하면 건너뜀)
    buildGovTextures(this); // 도트 국장 4단계 텍스처(gov-1..4)
    buildPropTextures(this); // 개표소 소품 텍스처(투표함/서류/깃발)
    buildWorkerTexture(this); // 미니 일꾼(직원) 텍스처
    buildCosmeticTextures(this); // 꾸미기 액세서리 오버레이(cos-*)
    this.scene.start("GameScene");
  }
}
