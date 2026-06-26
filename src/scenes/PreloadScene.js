import Phaser from "phaser";
import { generatePlaceholders } from "../textures/devPlaceholders.js";
import { createAnimations } from "../animations/createAnimations.js";
import { buildGovTextures } from "../world/dotChar.js";

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

    // 실제 아트(codex 생성, public/art). 로드된 키는 devPlaceholders가 "이미 존재하면 건너뜀".
    this.load.image("floor/pastel", "/art/floor-pastel.webp");
    this.load.image("room/back", "/art/room-back.webp");
    this.load.image("wall/back-left", "/art/window.webp");
    this.load.image("wall/back-right", "/art/window.webp");
    this.load.image("decor/plant", "/art/plant.webp");
    this.load.image("decor/ballotbox", "/art/ballotbox.webp");
    this.load.image("wall/clock", "/art/wall-clock.webp");
    this.load.image("wall/poster", "/art/wall-poster.webp");
    this.load.image("ballot", "/art/ballot.webp");
    this.load.image("worker/clerk", "/art/worker-clerk.webp");
    this.load.image("worker/clerk-2", "/art/worker-clerk-2.webp");
    this.load.image("worker/clerk-3", "/art/worker-clerk-3.webp");
    this.load.image("facility/desk/t1/idle", "/art/desk-t1.webp");
    this.load.image("facility/desk/t2/idle", "/art/desk-t2.webp");
    this.load.image("facility/desk/t3/idle", "/art/desk-t3.webp");
    this.load.image("facility/desk/t4/idle", "/art/desk-t4.webp");
    this.load.image("facility/desk/t5/idle", "/art/desk-t5.webp");

    // 나머지 5개 시설: t1~t3 실제 아트, t4/t5는 t3 재사용(아트 미제작분 폴백)
    ["sorter", "notice", "server", "archive", "studio"].forEach((id) => {
      this.load.image(`facility/${id}/t1/idle`, `/art/${id}-t1.webp`);
      this.load.image(`facility/${id}/t2/idle`, `/art/${id}-t2.webp`);
      this.load.image(`facility/${id}/t3/idle`, `/art/${id}-t3.webp`);
      this.load.image(`facility/${id}/t4/idle`, `/art/${id}-t3.webp`);
      this.load.image(`facility/${id}/t5/idle`, `/art/${id}-t3.webp`);
    });
  }

  create() {
    generatePlaceholders(this);
    createAnimations(this);
    buildGovTextures(this); // 도트 국장 4단계 텍스처(gov-1..4)
    this.scene.start("GameScene");
  }
}
