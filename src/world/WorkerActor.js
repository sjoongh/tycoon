import { worldMap } from "./worldMap.js";
import { workerDepth } from "./depth.js";
import { findPath } from "./pathGraph.js";

export class WorkerActor {
  constructor(scene, startNode = "entrance") {
    this.scene = scene;
    this.node = startNode;
    const p = worldMap.nav.nodes[startNode];
    const textureKey = scene.textures.exists("worker/clerk/sheet") ? "worker/clerk/sheet" : "worker/clerk";
    this.sprite = scene.add.sprite(p.x, p.y, textureKey, 0).setOrigin(0.5, 1);
    if (scene.anims.exists("worker-idle")) this.sprite.play("worker-idle");
  }

  _anim(key) {
    if (this.scene.anims.exists(key)) this.sprite.play(key, true);
  }

  _startBob() {
    if (this._bob) return;
    this._bob = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 1, to: 0.9 },
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  _stopBob() {
    if (!this._bob) return;
    this._bob.stop();
    this._bob = null;
    this.sprite.scaleY = 1;
  }

  goTo(goalNode, then) {
    const path = findPath(worldMap.nav, this.node, goalNode);
    if (!path || path.length < 2) {
      if (then) then();
      return;
    }
    this.node = goalNode;
    this._walkPath(path.slice(1), then);
  }

  _walkPath(remaining, then) {
    if (remaining.length === 0) {
      this._stopBob();
      this._anim("worker-work");
      if (then) then();
      return;
    }
    const next = worldMap.nav.nodes[remaining[0]];
    this._anim("worker-walk");
    this._startBob();
    this.sprite.setFlipX(next.x < this.sprite.x);
    this.scene.tweens.add({
      targets: this.sprite,
      x: next.x,
      y: next.y,
      duration: 700,
      ease: "Linear",
      onComplete: () => this._walkPath(remaining.slice(1), then),
    });
  }

  update() {
    this.sprite.setDepth(workerDepth(this.sprite.y));
  }

  destroy() {
    this._stopBob();
    this.sprite.destroy();
  }
}
