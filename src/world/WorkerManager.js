import { WorkerActor } from "./WorkerActor.js";
import { worldMap } from "./worldMap.js";

export class WorkerManager {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.workers = [];
  }

  sync() {
    const level = this.gameState.level("desk");
    const unlocked = this.gameState.isUnlocked("desk");
    const target = unlocked ? Math.min(2, Math.max(1, Math.ceil(level / 3))) : 0;

    while (this.workers.length < target) this._spawn();
    while (this.workers.length > target) this.workers.pop().destroy();
  }

  _spawn() {
    const worker = new WorkerActor(this.scene, "entrance");
    this.workers.push(worker);
    const loop = () => {
      worker.goTo("desk_front", () => {
        this.scene.time.delayedCall(1400, () => worker.goTo("entrance", () => {
          this.scene.time.delayedCall(600, loop);
        }));
      });
    };
    loop();
  }

  update() {
    this.workers.forEach((w) => w.update());
  }

  destroy() {
    this.workers.forEach((w) => w.destroy());
    this.workers = [];
  }
}
