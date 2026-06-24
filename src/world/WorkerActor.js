import { worldMap } from "./worldMap.js";
import { workerDepth } from "./depth.js";
import { findPath } from "./pathGraph.js";

export class WorkerActor {
  constructor(scene, startNode = "entrance", tint = null, textureKey = null) {
    this.scene = scene;
    this.node = startNode;
    this._pendingNode = startNode;
    const p = worldMap.nav.nodes[startNode];
    const key = textureKey && scene.textures.exists(textureKey)
      ? textureKey
      : scene.textures.exists("worker/clerk/sheet") ? "worker/clerk/sheet" : "worker/clerk";
    this.shadow = scene.add.ellipse(p.x, p.y - 2, 26, 10, 0x6a4a32, 0.2);
    this.sprite = scene.add.sprite(p.x, p.y, key, 0).setOrigin(0.5, 1);
    if (tint != null) this.sprite.setTint(tint);
    if (scene.anims.exists("worker-idle")) this.sprite.play("worker-idle");
    this._startBreath();
  }

  _anim(key) {
    if (this.scene.anims.exists(key)) this.sprite.play(key, true);
  }

  _resetScale() {
    this.scene.tweens.killTweensOf(this.sprite);
    this._bob = null;
    this._breath = null;
    this.sprite.scaleY = 1;
  }

  _startBob() {
    this._stopBreath();
    if (this._bob) return;
    this._bob = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 1, to: 0.9 },
      duration: 150, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  }

  _stopBob() {
    if (this._bob) { this._bob.stop(); this._bob = null; this.sprite.scaleY = 1; }
  }

  _startBreath() {
    if (this._breath) return;
    this._breath = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 1, to: 0.97 },
      duration: 950, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  }

  _stopBreath() {
    if (this._breath) { this._breath.stop(); this._breath = null; this.sprite.scaleY = 1; }
  }

  goTo(goalNode, then) {
    this._resetScale();
    this._pendingNode = goalNode;
    const path = findPath(worldMap.nav, this.node, goalNode);
    if (!path || path.length < 2) {
      this.node = goalNode;
      this._arrive();
      if (then) then();
      return;
    }
    this._walkPath(path.slice(1), then);
  }

  _arrive() {
    this.node = this._pendingNode;
    this._stopBob();
    this._anim("worker-work");
    this._startBreath();
  }

  _walkPath(remaining, then) {
    if (remaining.length === 0) {
      this._arrive();
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
      duration: 650,
      ease: "Linear",
      onComplete: () => this._walkPath(remaining.slice(1), then),
    });
  }

  update() {
    this.sprite.setDepth(workerDepth(this.sprite.y));
    this.shadow.setPosition(this.sprite.x, this.sprite.y - 2);
    this.shadow.setDepth(this.sprite.depth - 1);
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.sprite);
    this.shadow.destroy();
    this.sprite.destroy();
  }
}
