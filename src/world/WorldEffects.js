import { fxDepth } from "./depth.js";
import { FloatTextPool } from "../pools/FloatTextPool.js";
import { BallotPool } from "../pools/BallotPool.js";
import { motionReduced } from "../ui/a11y.js";

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

  // 반짝임 점은 1.2초마다 + 매 탭마다 생기므로 풀링(로드맵 #18). 움직임 줄이기면 장식이라 생략.
  deskPop(x, y) {
    if (this._destroyed || motionReduced()) return;
    if (!this._dots) this._dots = [];
    const dot = this._dots.pop() || this.scene.add.circle(0, 0, 4, 0xfff4cf);
    dot.setPosition(x, y).setAlpha(1).setDepth(fxDepth(y)).setVisible(true).setActive(true);
    this.scene.tweens.add({
      targets: dot,
      y: y - 18,
      alpha: 0,
      duration: 480,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (this._destroyed) { dot.destroy(); return; }
        dot.setVisible(false).setActive(false);
        if (this._dots.length < 12) this._dots.push(dot); else dot.destroy();
      },
    });
  }

  destroy() {
    this._destroyed = true;
  }
}
