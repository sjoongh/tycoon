import { worldMap } from "./worldMap.js";
import { workerDepth } from "./depth.js";
import { findPath } from "./pathGraph.js";

export class WorkerActor {
  constructor(scene, startNode = "entrance") {
    this.scene = scene;
    this.node = startNode;
    const p = worldMap.nav.nodes[startNode];
    this.sprite = scene.add.sprite(p.x, p.y, "worker/clerk/sheet", 0).setOrigin(0.5, 1);
    this.sprite.play("worker-idle");
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
      this.sprite.play("worker-work");
      if (then) then();
      return;
    }
    const next = worldMap.nav.nodes[remaining[0]];
    this.sprite.play("worker-walk", true);
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
    this.sprite.destroy();
  }
}
