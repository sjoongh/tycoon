import { tierForLevel, stationSpriteKey } from "./facilityTiers.js";
import { stationDepth } from "./depth.js";
import { facilities } from "../data/facilities.js";

// 티어별 화면 표시 폭(성장은 보이되 6개 시설이 한 방에 들어가게 제한)
const TIER_DISPLAY_W = { t1: 78, t2: 92, t3: 106, t4: 120, t5: 134 };

export class FacilityStationView {
  constructor(scene, facilityId, anchor) {
    this.scene = scene;
    this.facilityId = facilityId;
    this.anchor = anchor;
    this.tier = null;

    this.sprite = scene.add.sprite(anchor.x, anchor.y, stationSpriteKey(facilityId, "t1"))
      .setOrigin(0.5, 1)
      .setDepth(stationDepth(anchor.y))
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    this.ring = scene.add.ellipse(anchor.x, anchor.y, 70, 26, 0x8ec6a0, 0)
      .setStrokeStyle(3, 0x8ec6a0, 0)
      .setDepth(stationDepth(anchor.y) - 1);

    // 역할 이름표(어떤 시설인지 보이게)
    this.role = (facilities.find((f) => f.id === facilityId) || {}).role || facilityId;
    this.label = scene.add.text(anchor.x, anchor.y, this.role, {
      fontFamily: "Nunito, system-ui, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#5a463a",
      backgroundColor: "rgba(255,255,255,0.92)",
      padding: { x: 7, y: 2 },
    })
      .setOrigin(0.5, 1)
      .setDepth(stationDepth(anchor.y) + 50)
      .setVisible(false);
  }

  onSelect(callback) {
    this.sprite.on("pointerdown", () => {
      callback();
      this._tapPop();
    });
  }

  _tapPop() {
    const s = this.sprite.scaleX || 1;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: s * 1.1, to: s },
      scaleY: { from: s * 1.1, to: s },
      duration: 170,
      ease: "Back.easeOut",
    });
  }

  refresh({ level, unlocked, selected, canUpgrade }) {
    const tier = unlocked ? tierForLevel(level) : "locked";
    if (tier !== "locked" && tier !== this.tier) {
      const changing = this.tier !== null;
      this.tier = tier;
      this.sprite.setTexture(stationSpriteKey(this.facilityId, tier));
      this.sprite.displayWidth = TIER_DISPLAY_W[tier] || 90;
      this.sprite.scaleY = this.sprite.scaleX;
      this.sprite.setVisible(true);
      if (changing) this.playUpgrade();
    }
    const visible = unlocked && level > 0;
    this.sprite.setVisible(visible);
    // 선택 시 진한 링, 업그레이드 가능 시 옅은 링으로 "업그레이드 준비" 어포던스
    const ringAlpha = selected ? 0.9 : canUpgrade ? 0.4 : 0;
    this.ring.setStrokeStyle(3, 0x8ec6a0, ringAlpha);
    // 이름표를 시설 위에 띄움
    const top = this.anchor.y - (this.sprite.displayHeight || 60);
    this.label.setPosition(this.anchor.x, top - 4).setVisible(visible);
  }

  playUpgrade() {
    const s = this.sprite.scaleX || 1;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: s * 0.86, to: s },
      scaleY: { from: s * 0.86, to: s },
      duration: 220,
      ease: "Back.easeOut",
    });
  }

  destroy() {
    this.sprite.destroy();
    this.ring.destroy();
    this.label.destroy();
  }
}
