import { textStyle } from "../utils/format.js";

export class FloatTextPool {
  constructor(scene, size = 18) {
    this.scene = scene;
    this.size = size;
    this.items = [];
    this.gainLane = 0;
  }

  show(text, x, y, color = "#ffc857") {
    // 빠른 탭 보상은 중앙 수치 양옆 네 개 레인으로 흩어 완전히 포개지지 않게 한다.
    if (/^(?:🔥|🤖)?\s*\+/.test(text)) {
      const lane = this.gainLane % 4;
      const laneX = [-40, 40, -58, 58][lane];
      const laneY = [0, -10, -5, -15][lane];
      this.gainLane += 1;
      x = x >= 110 && x <= 280 && y >= 240 && y <= 390
        ? [90, 300, 62, 328][lane]
        : Math.max(34, Math.min(356, x + laneX));
      y += laneY;
    }
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
