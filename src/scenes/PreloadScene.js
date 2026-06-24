import Phaser from "phaser";
import { generatePlaceholders } from "../textures/devPlaceholders.js";
import { createAnimations } from "../animations/createAnimations.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // 실제 아트(codex 생성, public/art). 로드된 키는 devPlaceholders가 "이미 존재하면 건너뜀".
    this.load.image("floor/pastel", "/art/floor-pastel.png");
    this.load.image("room/back", "/art/room-back.png");
    this.load.image("wall/back-left", "/art/window.png");
    this.load.image("wall/back-right", "/art/window.png");
    this.load.image("decor/plant", "/art/plant.png");
    this.load.image("ballot", "/art/ballot.png");
    this.load.image("worker/clerk", "/art/worker-clerk.png");
    this.load.image("facility/desk/t1/idle", "/art/desk-t1.png");
    this.load.image("facility/desk/t2/idle", "/art/desk-t2.png");
    this.load.image("facility/desk/t3/idle", "/art/desk-t3.png");
    this.load.image("facility/desk/t4/idle", "/art/desk-t4.png");
    this.load.image("facility/desk/t5/idle", "/art/desk-t5.png");

    // 나머지 5개 시설: t1~t3 실제 아트, t4/t5는 t3 재사용(아트 미제작분 폴백)
    ["sorter", "notice", "server", "archive", "studio"].forEach((id) => {
      this.load.image(`facility/${id}/t1/idle`, `/art/${id}-t1.png`);
      this.load.image(`facility/${id}/t2/idle`, `/art/${id}-t2.png`);
      this.load.image(`facility/${id}/t3/idle`, `/art/${id}-t3.png`);
      this.load.image(`facility/${id}/t4/idle`, `/art/${id}-t3.png`);
      this.load.image(`facility/${id}/t5/idle`, `/art/${id}-t3.png`);
    });
  }

  create() {
    generatePlaceholders(this);
    createAnimations(this);
    this.scene.start("GameScene");
  }
}
