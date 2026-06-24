import Phaser from "phaser";
import { generatePlaceholders } from "../textures/devPlaceholders.js";
import { createAnimations } from "../animations/createAnimations.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // 실제 아트 파일이 생기면 여기서 this.load.image/spritesheet 로 동일 키를 로드해 교체.
  }

  create() {
    generatePlaceholders(this);
    createAnimations(this);
    this.scene.start("GameScene");
  }
}
