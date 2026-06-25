import { fxDepth } from "./depth.js";
import { FloatTextPool } from "../pools/FloatTextPool.js";
import { BallotPool } from "../pools/BallotPool.js";

export class WorldEffects {
  constructor(scene) {
    this.scene = scene;
    this.floatTexts = new FloatTextPool(scene);
    this.ballotPool = new BallotPool(scene);
  }

  float(payload) {
    this.floatTexts.show(payload.text, payload.x, payload.y, payload.color);
  }

  ballots(payload) {
    this.ballotPool.spawn(payload.x, payload.y, payload.count);
  }

  deskPop(x, y) {
    if (this._destroyed) return;
    const dot = this.scene.add.circle(x, y, 4, 0xfff4cf).setDepth(fxDepth(y));
    this.scene.tweens.add({
      targets: dot,
      y: y - 18,
      alpha: 0,
      duration: 480,
      ease: "Quad.easeOut",
      onComplete: () => { if (!this._destroyed) dot.destroy(); },
    });
  }

  destroy() {
    this._destroyed = true;
  }
}
