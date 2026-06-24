import { worldMap } from "./worldMap.js";
import { ASSET_KEYS } from "../assets/assetManifest.js";
import { FacilityStationView } from "./FacilityStationView.js";
import { WorkerManager } from "./WorkerManager.js";
import { WorldEffects } from "./WorldEffects.js";
import { DEPTH_BASE, stationDepth } from "./depth.js";

export class WorldView {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;

    this._buildRoomBack();
    this._buildFloor();
    this._buildWalls();
    this._buildDecor();

    this.desk = new FacilityStationView(scene, "desk", worldMap.facilities.desk.anchor);
    this.desk.onSelect(() => gameState.select("desk"));

    this.workers = new WorkerManager(scene, gameState);
    this.effects = new WorldEffects(scene);

    this._onChanged = () => this._refresh();
    this._onUpgraded = (facility) => { if (facility.id === "desk") this.desk.playUpgrade(); };
    this._onFloat = (p) => this.effects.float(p);
    this._onBallots = (p) => this.effects.ballots(p);
    gameState.on("changed", this._onChanged);
    gameState.on("upgraded", this._onUpgraded);
    gameState.on("float", this._onFloat);
    gameState.on("ballots", this._onBallots);

    // 하단 DOM 패널은 pointer-events:auto로 자체 탭을 가로채므로, 캔버스에 도달한 탭만 처리한다
    this._onPointer = (pointer) => {
      gameState.processClick(pointer.x, pointer.y);
    };
    scene.input.on("pointerdown", this._onPointer);

    this._refresh();
    this._workTimer = scene.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        if (this.gameState.level("desk") > 0) {
          const spot = worldMap.facilities.desk.workSpots[0];
          this.effects.deskPop(spot.x, spot.y);
        }
      },
    });
  }

  _buildFloor() {
    const f = worldMap.floor;
    for (let r = 0; r < f.rows; r++) {
      for (let c = 0; c < f.cols; c++) {
        const x = f.originX + (c - r) * (f.tileW / 2);
        const y = f.originY + (c + r) * (f.tileH / 2);
        this.scene.add.image(x, y, ASSET_KEYS.floor).setDisplaySize(f.tileW, f.tileH).setDepth(DEPTH_BASE.floor + y);
      }
    }
  }

  _buildRoomBack() {
    if (!worldMap.room) return;
    this.scene.add.image(worldMap.room.x, worldMap.room.y, worldMap.room.key).setDepth(1);
  }

  _buildWalls() {
    worldMap.walls.forEach((w) => {
      this.scene.add.image(w.x, w.y, w.key).setDepth(5);
    });
  }

  _buildDecor() {
    (worldMap.decor || []).forEach((d) => {
      this.scene.add.image(d.x, d.y, d.key).setOrigin(0.5, 1).setDepth(stationDepth(d.y));
    });
  }

  _refresh() {
    const level = this.gameState.level("desk");
    const unlocked = this.gameState.isUnlocked("desk");
    const selected = this.gameState.data.selected === "desk";
    const canUpgrade = unlocked
      && this.gameState.data.votes >= this.gameState.cost("desk")
      && this.gameState.data.explain >= this.gameState.explainCost("desk");
    this.desk.refresh({ level, unlocked, selected, canUpgrade });
    this.workers.sync();
  }

  update() {
    this.workers.update();
  }

  destroy() {
    this.gameState.off("changed", this._onChanged);
    this.gameState.off("upgraded", this._onUpgraded);
    this.gameState.off("float", this._onFloat);
    this.gameState.off("ballots", this._onBallots);
    this.scene.input.off("pointerdown", this._onPointer);
    this._workTimer?.remove();
    this.desk.destroy();
    this.workers.destroy();
    this.effects.destroy();
  }
}
