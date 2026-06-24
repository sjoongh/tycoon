import { WorkerActor } from "./WorkerActor.js";
import { worldMap } from "./worldMap.js";
import { facilities } from "../data/facilities.js";

// 직원 색 다양화(틴트) — 복제 인형처럼 안 보이게
const WORKER_TINTS = [0xffffff, 0xffd4dc, 0xd6d2ff, 0xcdeedd, 0xfff0c4, 0xffe0b8];

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
    const target = activeCount ? Math.min(6, Math.max(1, activeCount + Math.floor(staffTotal / 3))) : 0;

    while (this.workers.length < target) this._spawn();
    while (this.workers.length > target) {
      const w = this.workers.pop();
      this.scene.tweens.add({ targets: [w.sprite, w.shadow], alpha: 0, duration: 350, onComplete: () => w.destroy() });
    }
  }

  _spawn() {
    const idx = this.workers.length;
    const worker = new WorkerActor(this.scene, "entrance", WORKER_TINTS[idx % WORKER_TINTS.length]);
    this.workers.push(worker);
    const alive = () => this.workers.includes(worker);

    const loop = () => {
      if (!alive()) return;
      const nodes = this._activeNodes();
      if (!nodes.length) {
        this.scene.time.delayedCall(1500, () => { if (alive()) loop(); });
        return;
      }
      // 70% 자기 담당 시설(affinity), 30% 다른 곳 — 한 점에 몰리지 않게
      const home = nodes[idx % nodes.length];
      const target = Math.random() < 0.7 ? home : nodes[Math.floor(Math.random() * nodes.length)];
      worker.goTo(target, () => {
        if (!alive()) return;
        this.scene.time.delayedCall(1800 + Math.random() * 2200, () => { if (alive()) loop(); });
      });
    };
    // 동시 출발 방지 스태거
    this.scene.time.delayedCall(idx * 350 + Math.random() * 300, loop);
  }

  update() {
    this.workers.forEach((w) => w.update());
  }

  destroy() {
    this.workers.forEach((w) => w.destroy());
    this.workers = [];
  }
}
