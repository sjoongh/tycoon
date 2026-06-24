import { WorkerActor } from "./WorkerActor.js";
import { worldMap } from "./worldMap.js";
import { facilities } from "../data/facilities.js";

export class WorkerManager {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.workers = [];
  }

  _activeNodes() {
    return facilities
      .filter((f) => this.gameState.isUnlocked(f.id) && this.gameState.level(f.id) > 0 && worldMap.facilities[f.id])
      .map((f) => worldMap.facilities[f.id].navNode);
  }

  sync() {
    const staff = this.gameState.data.staff || {};
    const staffTotal = Object.values(staff).reduce((a, b) => a + b, 0);
    const activeCount = this._activeNodes().length;
    // 활성 시설마다 1명 + 직원 보너스(겹침 방지). 활성 시설 수를 넘지 않게 하되 직원 많으면 소폭 증가.
    const target = activeCount ? Math.min(6, Math.max(1, activeCount + Math.floor(staffTotal / 3))) : 0;

    while (this.workers.length < target) this._spawn();
    while (this.workers.length > target) this.workers.pop().destroy();
  }

  _spawn() {
    const worker = new WorkerActor(this.scene, "entrance");
    this.workers.push(worker);
    const alive = () => this.workers.includes(worker);
    const loop = () => {
      if (!alive()) return;
      const nodes = this._activeNodes();
      const target = nodes.length ? nodes[Math.floor(Math.random() * nodes.length)] : "mid";
      worker.goTo(target, () => {
        if (!alive()) return;
        this.scene.time.delayedCall(1200 + Math.random() * 1400, () => {
          if (alive()) loop();
        });
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
