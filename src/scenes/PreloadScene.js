import Phaser from "phaser";
import { generatePlaceholders } from "../textures/devPlaceholders.js";
import { buildGovTextures, buildPropTextures, buildWorkerTexture, buildCosmeticTextures } from "../world/dotChar.js";
import { loadIconSheets, registerIconFrames } from "../assets/iconTextures.js";
import { WORLD_ATLAS, facilitySpriteKey } from "../world/worldAtlas.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // 로딩 스크린(진행바) — 무거운 초기 에셋 로드 동안 검은화면/탭유실 방지
    const W = 390;
    const H = 844;
    this.add.rectangle(W / 2, H / 2, W, H, 0x2b2420);
    this.add.text(W / 2, H / 2 - 46, "믿어주세요 개표국", {
      fontFamily: "system-ui, sans-serif", fontSize: "22px", fontStyle: "bold", color: "#ffe1a6",
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
    this.load.spritesheet("workers", "/art/world/workers.png", { frameWidth: WORLD_ATLAS.workers.frame, frameHeight: WORLD_ATLAS.workers.frame });
  }

  create() {
    registerIconFrames(this);
    // 직원 애니메이션 — 변형(머리색·셔츠)별 idle/typing-right/typing-left (OGA 시트 행 0/4/5)
    const { cols, rowsPerVariant, variants } = WORLD_ATLAS.workers;
    const row = (v, r) => Array.from({ length: cols }, (_, c) => (v * rowsPerVariant + r) * cols + c);
    for (let v = 0; v < variants; v += 1) {
      if (!this.anims.exists(`worker-idle-${v}`)) this.anims.create({ key: `worker-idle-${v}`, frames: this.anims.generateFrameNumbers("workers", { frames: [row(v, 0)[0]] }), frameRate: 1, repeat: -1 });
      if (!this.anims.exists(`worker-walk-${v}`)) this.anims.create({ key: `worker-walk-${v}`, frames: this.anims.generateFrameNumbers("workers", { frames: row(v, 0) }), frameRate: 6, repeat: -1 });
      if (!this.anims.exists(`worker-type-right-${v}`)) this.anims.create({ key: `worker-type-right-${v}`, frames: this.anims.generateFrameNumbers("workers", { frames: row(v, 4) }), frameRate: 6, repeat: -1 });
      if (!this.anims.exists(`worker-type-left-${v}`)) this.anims.create({ key: `worker-type-left-${v}`, frames: this.anims.generateFrameNumbers("workers", { frames: row(v, 5) }), frameRate: 6, repeat: -1 });
    }
    generatePlaceholders(this); // ballot 폴백 등 안전망(존재하면 건너뜀)
    buildGovTextures(this); // 도트 국장 4단계 텍스처(gov-1..4)
    buildPropTextures(this); // 개표소 소품 텍스처(투표함/서류/깃발)
    buildWorkerTexture(this); // 미니 일꾼(직원) 텍스처
    buildCosmeticTextures(this); // 꾸미기 액세서리 오버레이(cos-*)
    this.scene.start("GameScene");
  }
}
