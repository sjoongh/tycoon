import Phaser from "phaser";
import { facilities } from "../data/facilities.js";
import { BallotPool } from "../pools/BallotPool.js";
import { FloatTextPool } from "../pools/FloatTextPool.js";
import { textStyle } from "../utils/format.js";
import { BuildingNode } from "../world/BuildingNode.js";
import { WorkerAgent } from "../world/WorkerAgent.js";
import { walkwayPoints, worldNodes } from "../world/worldLayout.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.gameState = this.registry.get("gameState");
    this.facilityViews = {};
    this.activityViews = {};
    this.workers = [];
    this.floatTexts = new FloatTextPool(this);
    this.ballots = new BallotPool(this);

    this.createWorld();
    this.createFacilities();
    this.createActivityOverlays();
    this.syncWorkers();

    this.input.on("pointerdown", (pointer) => {
      if (pointer.y > 548) return;
      this.gameState.processClick(pointer.x, pointer.y);
    });

    this.gameState.on("changed", this.handleStateChanged, this);
    this.gameState.on("float", this.handleFloat, this);
    this.gameState.on("ballots", this.handleBallots, this);
    this.events.once("shutdown", () => {
      this.gameState.off("changed", this.handleStateChanged, this);
      this.gameState.off("float", this.handleFloat, this);
      this.gameState.off("ballots", this.handleBallots, this);
    });

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.gameState.tick() });
    this.time.addEvent({ delay: 1300, loop: true, callback: () => this.pulseFacilities() });
    this.time.addEvent({ delay: 380, loop: true, callback: () => this.spawnLinkedActivity() });
    this.handleStateChanged();
  }

  update(time, delta) {
    this.workers.forEach((worker) => worker.update(delta));
    this.gameState.autosave(delta);
  }

  createWorld() {
    this.add.image(195, 422, "world-office").setDisplaySize(482, 844);
    this.add.rectangle(195, 422, 390, 844, 0x000000, 0.08);
    this.districtBanner = this.add.container(195, 176).setDepth(120);
    this.districtBanner.add(this.add.rectangle(0, 0, 184, 30, 0x241e34, 0.94).setStrokeStyle(3, 0x4b3428));
    this.districtText = this.add.text(0, 0, "", textStyle(13, "#fff4cf")).setOrigin(0.5);
    this.districtBanner.add(this.districtText);
  }

  createFacilities() {
    facilities.forEach((facility) => {
      const node = new BuildingNode(this, facility, worldNodes[facility.id]);
      node.onSelect(() => this.gameState.select(facility.id));
      this.facilityViews[facility.id] = node;
    });
  }

  createActivityOverlays() {
    this.activityViews.desk = this.add.container(126, 404).setDepth(95);
    this.activityViews.sorter = this.add.container(260, 500).setDepth(96);
    this.activityViews.notice = this.add.container(84, 456).setDepth(96);
    this.activityViews.server = this.add.container(92, 306).setDepth(96);
    this.activityViews.archive = this.add.container(232, 252).setDepth(96);
    this.activityViews.studio = this.add.container(320, 330).setDepth(96);

    this.activityViews.desk.add(this.add.sprite(0, 0, "paper-stack").setScale(0.82));
    this.activityViews.archive.add(this.add.sprite(0, 0, "paper-stack").setScale(0.72));
    this.activityViews.server.add(this.add.sprite(0, 0, "data-orb").setScale(0.8));
    this.activityViews.notice.add(this.add.sprite(0, 0, "spark").setScale(0.7));
    this.activityViews.studio.add(this.add.sprite(0, 0, "spark").setScale(0.7));

    Object.values(this.activityViews).forEach((view) => view.setVisible(false));
  }

  handleStateChanged() {
    this.refreshFacilityLevels();
    this.syncWorkers();
  }

  refreshFacilityLevels() {
    facilities.forEach((facility) => {
      const view = this.facilityViews[facility.id];
      if (!view) return;
      const level = this.gameState.level(facility.id);
      const unlocked = this.gameState.isUnlocked(facility.id);
      const selected = this.gameState.data.selected === facility.id;
      const canUpgrade =
        unlocked &&
        this.gameState.data.votes >= this.gameState.cost(facility.id) &&
        this.gameState.data.explain >= this.gameState.explainCost(facility.id);
      view.refresh({ level, unlocked, selected, canUpgrade });
    });

    if (this.districtText) {
      this.districtText.setText(`${this.gameState.data.stage.area}구역 운영중`);
    }
    this.refreshActivityOverlays();
  }

  refreshActivityOverlays() {
    facilities.forEach((facility) => {
      const view = this.activityViews[facility.id];
      if (!view) return;
      const active = this.gameState.isUnlocked(facility.id) && this.gameState.level(facility.id) > 0;
      view.setVisible(active);
      view.setAlpha(active ? Phaser.Math.Clamp(0.45 + this.gameState.level(facility.id) * 0.025, 0.55, 1) : 0);
    });
  }

  syncWorkers() {
    const staffTotal = Object.values(this.gameState.data.staff).reduce((sum, level) => sum + level, 0);
    const facilityTotal = this.gameState.facilityTotal();
    const target = Phaser.Math.Clamp(2 + Math.floor(staffTotal / 2) + Math.floor(facilityTotal / 12), 2, 9);

    while (this.workers.length < target) this.addWorker(this.workers.length);
    while (this.workers.length > target) {
      const worker = this.workers.pop();
      worker.destroy();
    }

    this.workers.forEach((worker, index) => worker.setRoute(this.routeForWorker(index)));
  }

  addWorker(index) {
    const palettes = ["yellow", "blue", "pink", "green"];
    const palette = palettes[index % palettes.length];
    this.workers.push(new WorkerAgent(this, index, palette, this.routeForWorker(index), 82 + index));
  }

  routeForWorker(index) {
    const active = facilities
      .filter((facility) => this.gameState.isUnlocked(facility.id) && this.gameState.level(facility.id) > 0)
      .sort((a, b) => this.gameState.level(b.id) - this.gameState.level(a.id));
    const facility = active[index % Math.max(1, active.length)] || facilities[0];
    const node = worldNodes[facility.id];
    const entry = walkwayPoints[index % walkwayPoints.length];
    return [entry, ...node.workSpots];
  }

  pulseFacilities() {
    facilities.forEach((facility) => {
      const level = this.gameState.level(facility.id);
      if (level <= 0 || !this.gameState.isUnlocked(facility.id)) return;
      if (Math.random() > Math.min(0.88, 0.22 + level * 0.026)) return;

      const view = this.facilityViews[facility.id];
      const layout = worldNodes[facility.id];
      if (!view || !layout) return;

      const spot = Phaser.Utils.Array.GetRandom(layout.effectSpots);
      this.ballots.spawn(spot.x, spot.y, Math.min(5, 1 + Math.floor(level / 6)));
      this.spawnSpark(spot.x, spot.y - 4);
      view.pulse();
    });
  }

  spawnLinkedActivity() {
    const active = facilities.filter((facility) => this.gameState.isUnlocked(facility.id) && this.gameState.level(facility.id) > 0);
    if (active.length === 0) return;
    const total = active.reduce((sum, facility) => sum + Math.max(1, this.gameState.level(facility.id)), 0);
    let roll = Math.random() * total;
    const facility = active.find((item) => {
      roll -= Math.max(1, this.gameState.level(item.id));
      return roll <= 0;
    }) || active[0];

    if (facility.id === "sorter") {
      this.spawnConveyorBallot();
      return;
    }
    if (facility.id === "server") {
      this.spawnDataPulse();
      return;
    }
    if (facility.id === "notice" || facility.id === "studio") {
      this.spawnSpark(worldNodes[facility.id].x, worldNodes[facility.id].y - 28);
      return;
    }
    this.spawnPaperPop(facility.id);
  }

  spawnConveyorBallot() {
    const points = [
      { x: 224, y: 488 },
      { x: 256, y: 506 },
      { x: 300, y: 500 },
      { x: 326, y: 470 },
    ];
    const ballot = this.add.sprite(points[0].x, points[0].y, "ballot").setScale(0.86).setDepth(125);
    this.tweens.add({
      targets: ballot,
      x: points[1].x,
      y: points[1].y,
      duration: 230,
      ease: "Linear",
      onComplete: () => {
        this.tweens.add({
          targets: ballot,
          x: points[2].x,
          y: points[2].y,
          duration: 240,
          ease: "Linear",
          onComplete: () => {
            this.tweens.add({
              targets: ballot,
              x: points[3].x,
              y: points[3].y,
              alpha: 0,
              duration: 260,
              ease: "Quad.easeOut",
              onComplete: () => ballot.destroy(),
            });
          },
        });
      },
    });
  }

  spawnDataPulse() {
    const orb = this.add.sprite(92, 306, "data-orb").setScale(0.5).setAlpha(0.85).setDepth(126);
    this.tweens.add({
      targets: orb,
      x: 136 + Phaser.Math.Between(-12, 12),
      y: 324 + Phaser.Math.Between(-12, 12),
      scale: 0.18,
      alpha: 0,
      duration: 620,
      ease: "Cubic.easeOut",
      onComplete: () => orb.destroy(),
    });
  }

  spawnPaperPop(facilityId) {
    const layout = worldNodes[facilityId];
    const spot = Phaser.Utils.Array.GetRandom(layout.effectSpots);
    const paper = this.add.sprite(spot.x, spot.y, "paper-stack").setScale(0.55).setDepth(124);
    this.tweens.add({
      targets: paper,
      y: paper.y - 16,
      scale: 0.68,
      alpha: 0,
      duration: 520,
      ease: "Quad.easeOut",
      onComplete: () => paper.destroy(),
    });
  }

  spawnSpark(x, y) {
    const spark = this.add.sprite(x + Phaser.Math.Between(-10, 10), y + Phaser.Math.Between(-10, 4), "spark").setScale(0.7).setDepth(130);
    this.tweens.add({
      targets: spark,
      y: spark.y - 18,
      alpha: 0,
      scale: 1.05,
      duration: 520,
      ease: "Quad.easeOut",
      onComplete: () => spark.destroy(),
    });
  }

  handleFloat(payload) {
    this.floatTexts.show(payload.text, payload.x, payload.y, payload.color);
  }

  handleBallots(payload) {
    this.ballots.spawn(payload.x, payload.y, payload.count);
  }
}
