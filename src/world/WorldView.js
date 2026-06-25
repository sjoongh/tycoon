import { worldMap } from "./worldMap.js";
import { ASSET_KEYS } from "../assets/assetManifest.js";
import { facilities } from "../data/facilities.js";
import { FacilityStationView } from "./FacilityStationView.js";
import { WorkerManager } from "./WorkerManager.js";
import { WorldEffects } from "./WorldEffects.js";
import { DEPTH_BASE, stationDepth } from "./depth.js";
import { shortNumber } from "../utils/format.js";

export class WorldView {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;

    // era 톤: 방/바닥/벽 이미지에만 구간별 tint를 적용한다(워커·플로팅은 제외해 탁해지지 않게)
    this._eraImages = [];
    this._eraArea = -1;

    this._buildRoomBack();
    this._buildFloor();
    this._buildWalls();
    this._buildDecor();

    this.stations = {};
    facilities.forEach((f) => {
      const fm = worldMap.facilities[f.id];
      if (!fm) return;
      const view = new FacilityStationView(scene, f.id, fm.anchor);
      view.onSelect(() => gameState.select(f.id));
      this.stations[f.id] = view;
    });

    this.workers = new WorkerManager(scene, gameState);
    this.effects = new WorldEffects(scene);

    this._onChanged = () => this._refresh();
    this._onUpgraded = (facility) => this.stations[facility.id]?.playUpgrade();
    this._onFloat = (p) => this.effects.float(p);
    this._onBallots = (p) => this.effects.ballots(p);
    gameState.on("changed", this._onChanged);
    gameState.on("upgraded", this._onUpgraded);
    gameState.on("float", this._onFloat);
    gameState.on("ballots", this._onBallots);

    // 하단 DOM 패널은 pointer-events:auto로 자체 탭을 가로채므로, 캔버스에 도달한 탭만 처리한다
    this._onPointer = (pointer, currentlyOver) => {
      // 시설 스프라이트 등 인터랙티브 오브젝트 위 탭은 '선택'으로 처리 — 빈 공간/소품 탭만 득표(클릭 중복 방지)
      if (currentlyOver && currentlyOver.length) return;
      gameState.processClick(pointer.x, pointer.y);
      this._squishBallotbox();
    };
    scene.input.on("pointerdown", this._onPointer);

    this._refresh();
    this._workTimer = scene.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        const active = facilities.filter((f) => this.gameState.isUnlocked(f.id) && this.gameState.level(f.id) > 0);
        if (active.length === 0) return;
        // 벽시계 기반 인덱스는 프레임 지터/탭 스로틀 시 중복·누락이 생겨 라운드로빈 카운터로 교체
        this._popIdx = ((this._popIdx || 0) + 1) % active.length;
        const f = active[this._popIdx];
        const spot = worldMap.facilities[f.id]?.workSpots[0];
        if (spot) this.effects.deskPop(spot.x, spot.y);
        // 패시브 수입 가시화: 가끔 시설 위로 +표 플로팅
        this._incomeTick = (this._incomeTick || 0) + 1;
        if (this._incomeTick % 2 === 0 && spot) {
          const inc = this.gameState.cps();
          if (inc > 0) this.effects.float({ text: `+${shortNumber(inc)}`, x: spot.x, y: spot.y - 16, color: "#7fb98a" });
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
        const tile = this.scene.add.image(x, y, ASSET_KEYS.floor).setDisplaySize(f.tileW, f.tileH).setDepth(DEPTH_BASE.floor + y);
        this._eraImages.push(tile);
      }
    }
  }

  _buildRoomBack() {
    const r = worldMap.room;
    if (!r) return;
    const img = this.scene.add.image(r.x, r.y, r.key).setDepth(1);
    if (r.w && r.h) img.setDisplaySize(r.w, r.h);
    this._eraImages.push(img);
  }

  _buildWalls() {
    worldMap.walls.forEach((w) => {
      this._eraImages.push(this.scene.add.image(w.x, w.y, w.key).setDepth(5));
    });
  }

  // 구역(area)이 오를수록 새벽→오후→해질녘→야간 분위기로. 1구역은 원색(무틴트).
  _eraTintFor(area) {
    if (area <= 1) return 0xffffff;
    if (area === 2) return 0xfff0d4; // 따뜻한 오전
    if (area === 3) return 0xffe3b0; // 호박빛 오후
    if (area === 4) return 0xf3c79a; // 해질녘
    if (area === 5) return 0xc9b3e6; // 보랏빛 황혼
    return 0x9fb0e0; // 6구역+ 야간 블루
  }

  _applyEra(area) {
    if (area === this._eraArea) return;
    this._eraArea = area;
    const tint = this._eraTintFor(area);
    this._eraImages.forEach((img) => img.setTint(tint));
  }

  _buildDecor() {
    (worldMap.decor || []).forEach((d) => {
      const img = this.scene.add.image(d.x, d.y, d.key).setOrigin(0.5, 1).setDepth(stationDepth(d.y));
      if (d.scale) img.setScale(d.scale);
      if (d.key === "decor/ballotbox") {
        this.ballotbox = img;
        this._ballotboxScale = img.scaleX;
      }
    });
  }

  _squishBallotbox() {
    if (!this.ballotbox) return;
    const s = this._ballotboxScale;
    this.scene.tweens.killTweensOf(this.ballotbox);
    this.ballotbox.setScale(s);
    this.scene.tweens.add({
      targets: this.ballotbox,
      scaleX: s * 1.1,
      scaleY: s * 0.9,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  _refresh() {
    const gs = this.gameState;
    this._applyEra(gs.data.stage.area);
    facilities.forEach((f) => {
      const view = this.stations[f.id];
      if (!view) return;
      const unlocked = gs.isUnlocked(f.id);
      const canUpgrade = unlocked && gs.data.votes >= gs.cost(f.id) && gs.data.explain >= gs.explainCost(f.id);
      view.refresh({ level: gs.level(f.id), unlocked, selected: gs.data.selected === f.id, canUpgrade });
    });
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
    Object.values(this.stations).forEach((v) => v.destroy());
    this.workers.destroy();
    this.effects.destroy();
  }
}
