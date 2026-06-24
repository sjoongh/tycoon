import { textStyle } from "../utils/format.js";

export class FloatTextPool {
  constructor(scene, size = 18) {
    this.scene = scene;
    this.size = size;
    this.items = [];
  }

  show(text, x, y, color = "#ffc857") {
    const label = this.items.pop() || this.scene.add.text(0, 0, "", textStyle(this.size, color)).setOrigin(0.5);
    label.setText(text);
    label.setStyle(textStyle(this.size, color));
    label.setStroke("#4b3428", 5);
    label.setPosition(x, y);
    label.setAlpha(1);
    label.setVisible(true);
    label.setActive(true);

    this.scene.tweens.add({
      targets: label,
      y: y - 46,
      alpha: 0,
      duration: 900,
      ease: "Cubic.out",
      onComplete: () => {
        label.setVisible(false);
        label.setActive(false);
        this.items.push(label);
      },
    });
  }
}
