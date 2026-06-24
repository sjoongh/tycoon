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
    // 선택 시 진한 링, 업그레이드 가능 시 옅은 링으로 "업그레이드 준비" 어포던스
    const ringAlpha = selected ? 0.9 : canUpgrade ? 0.4 : 0;
    this.ring.setStrokeStyle(3, 0x8ec6a0, ringAlpha);
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
