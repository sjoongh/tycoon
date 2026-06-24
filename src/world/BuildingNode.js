import { textStyle } from "../utils/format.js";

export class BuildingNode {
  constructor(scene, facility, layout) {
    this.scene = scene;
    this.facility = facility;
    this.layout = layout;
    this.level = 0;
    this.unlocked = false;
    this.canUpgrade = false;
    this.selected = false;

    this.container = scene.add.container(layout.x, layout.y).setDepth(70);
    this.ring = scene.add.circle(0, 0, 30, 0xfff4cf, 0).setStrokeStyle(4, 0xfff4cf, 0);
    this.panel = scene.add.rectangle(0, 0, 76, 29, 0x171322, 0.9).setStrokeStyle(3, facility.color);
    this.levelText = scene.add.text(0, 7, "Lv.0", textStyle(9, "#ffc857")).setOrigin(0.5);
    this.labelText = scene.add.text(0, -6, layout.label, textStyle(10, "#fff4cf")).setOrigin(0.5);
    this.lockText = scene.add.text(0, 1, "", textStyle(9, "#fff4cf")).setOrigin(0.5);
    this.badge = scene.add.container(33, -18);
    this.badge.add(scene.add.circle(0, 0, 11, 0x89d98b).setStrokeStyle(3, 0x4b3428));
    this.badge.add(scene.add.text(0, -1, "↑", textStyle(13, "#271f36")).setOrigin(0.5));

    this.container.add([this.ring, this.panel, this.labelText, this.levelText, this.lockText, this.badge]);
    this.container.setSize(82, 38);
    this.container.setInteractive({ useHandCursor: true });
  }

  onSelect(callback) {
    this.container.on("pointerdown", callback);
  }

  refresh({ level, unlocked, selected, canUpgrade }) {
    this.level = level;
    this.unlocked = unlocked;
    this.selected = selected;
    this.canUpgrade = canUpgrade;

    this.ring.setAlpha(selected ? 0.9 : 0);
    this.panel.setAlpha(unlocked ? 1 : 0.5);
    this.labelText.setVisible(unlocked);
    this.levelText.setVisible(unlocked);
    this.lockText.setVisible(!unlocked);
    this.lockText.setText(`${this.facility.unlock}구역`);
    this.levelText.setText(`Lv.${level}`);
    this.badge.setVisible(canUpgrade);
    this.container.setScale(selected ? 1.06 : 1);
  }

  pulse() {
    if (!this.unlocked || this.level <= 0) return;
    this.scene.tweens.add({
      targets: this.container,
      scale: { from: this.selected ? 1.11 : 1.05, to: this.selected ? 1.06 : 1 },
      duration: 180,
      ease: "Quad.easeOut",
    });
  }

  destroy() {
    this.container.destroy();
  }
}
