import Phaser from "phaser";

export class BallotPool {
  constructor(scene, size = 40) {
    this.scene = scene;
    this.items = Array.from({ length: size }, () =>
      scene.add.sprite(-100, -100, "ballot").setScale(1.5).setVisible(false).setActive(false),
    );
  }

  spawn(x, y, count = 6) {
    for (let i = 0; i < count; i += 1) {
      const ballot = this.items.pop() || this.scene.add.sprite(-100, -100, "ballot").setScale(1.5);
      ballot.setPosition(x + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-10, 10));
      ballot.setAngle(0);
      ballot.setAlpha(1);
      ballot.setVisible(true);
      ballot.setActive(true);

      this.scene.tweens.add({
        targets: ballot,
        x: Phaser.Math.Between(88, 300),
        y: Phaser.Math.Between(360, 560),
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
