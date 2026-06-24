import Phaser from "phaser";
import { createPixelTextures } from "../textures/createPixelTextures.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("world-office", "/art/world-office.png");
  }

  create() {
    createPixelTextures(this);
    this.scene.start("GameScene");
    this.scene.launch("UIScene");
  }
}
