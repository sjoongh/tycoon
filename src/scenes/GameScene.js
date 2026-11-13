import Phaser from "phaser";
import { applyRenderScale } from "../world/renderScale.js";
import { WorldView } from "../world/WorldView.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.renderBase = applyRenderScale(this);
    // 캔버스는 renderScale배로 그리는데 텍스트 텍스처는 1배라 확대되며 흐려진다 — 생성 시 해상도를 맞춘다.
    const textRes = this.renderBase.zoom;
    if (textRes > 1) {
      const addText = this.add.text.bind(this.add);
      this.add.text = (x, y, text, style = {}) => addText(x, y, text, style.resolution ? style : { ...style, resolution: textRes });
    }
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
