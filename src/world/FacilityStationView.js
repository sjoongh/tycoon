import { tierForLevel, stationSpriteKey } from "./facilityTiers.js";
import { stationDepth } from "./depth.js";

export class FacilityStationView {
  constructor(scene, facilityId, anchor) {
    this.scene = scene;
    this.facilityId = facilityId;
    this.anchor = anchor;
    this.tier = null;

    this.sprite = scene.add.sprite(anchor.x, anchor.y, stationSpriteKey(facilityId, "t1"))
      .setOrigin(0.5, 1)
      .setDepth(stationDepth(anchor.y))
      .setInteractive({ useHandCursor: true });

    this.ring = scene.add.ellipse(anchor.x, anchor.y, 70, 26, 0x8ec6a0, 0)
      .setStrokeStyle(3, 0x8ec6a0, 0)
      .setDepth(stationDepth(anchor.y) - 1);
  }

  onSelect(callback) {
    this.sprite.on("pointerdown", callback);
  }

  refresh({ level, unlocked, selected, canUpgrade }) {
    const tier = unlocked ? tierForLevel(level) : "locked";
    if (tier !== "locked" && tier !== this.tier) {
      const changing = this.tier !== null;
      this.tier = tier;
      this.sprite.setTexture(stationSpriteKey(this.facilityId, tier));
      this.sprite.setVisible(true);
      if (changing) this.playUpgrade();
    }
    this.sprite.setVisible(unlocked && level > 0);
    this.ring.setStrokeStyle(3, 0x8ec6a0, selected ? 0.9 : 0);
    this.sprite.setTint(canUpgrade ? 0xffffff : 0xffffff);
    // 작업 애니 강도(틴트 펄스 등)는 WorldView의 틱에서 별도 처리
  }

  playUpgrade() {
    this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 0.86, to: 1 },
      duration: 220,
      ease: "Back.easeOut",
    });
  }

  destroy() {
    this.sprite.destroy();
    this.ring.destroy();
  }
}
