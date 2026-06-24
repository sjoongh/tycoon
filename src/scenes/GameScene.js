import Phaser from "phaser";
import { WorldView } from "../world/WorldView.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.gameState = this.registry.get("gameState");
    this.world = new WorldView(this, this.gameState);

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.gameState.tick() });

    this.events.once("shutdown", () => this.world.destroy());
  }

  update(time, delta) {
    this.world.update(delta);
    this.gameState.autosave(delta);
  }
}
