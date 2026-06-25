import Phaser from "phaser";
import { GameState } from "../state/GameState.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    if (!this.registry.get("gameState")) this.registry.set("gameState", new GameState());
    this.scene.start("PreloadScene");
  }
}
