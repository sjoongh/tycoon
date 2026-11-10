import Phaser from "phaser";
import { DEPTH_BASE } from "../world/depth.js";

// 방 이미지(depth 5)·시설·직원 위에 보이도록 효과 레이어로 올린다.
const FX_DEPTH = DEPTH_BASE.fx + 900;

export class BallotPool {
  constructor(scene, size = 40) {
    this.scene = scene;
    this.items = Array.from({ length: size }, () =>
      scene.add.sprite(-100, -100, "ballot").setScale(1.1).setDepth(FX_DEPTH).setVisible(false).setActive(false),
    );
  }

  spawn(x, y, count = 6) {
    const actual = Math.min(count, this.items.length);
    for (let i = 0; i < actual; i += 1) {
      const ballot = this.items.pop();
      ballot.setPosition(x + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-10, 10));
      ballot.setAngle(0);
      ballot.setAlpha(1);
      ballot.setVisible(true);
      ballot.setActive(true);

      this.scene.tweens.add({
        targets: ballot,
        x: x + Phaser.Math.Between(-90, 90),
        y: y + Phaser.Math.Between(30, 120),
        angle: Phaser.Math.Between(-160, 160),
        alpha: 0,
        duration: 650,
        ease: "Cubic.out",
        onComplete: () => {
          ballot.setVisible(false);
          ballot.setActive(false);
          this.items.push(ballot);
        },
      });
    }
  }
}
