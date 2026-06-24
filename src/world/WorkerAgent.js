export class WorkerAgent {
  constructor(scene, id, palette, route, depth = 80) {
    this.scene = scene;
    this.id = id;
    this.palette = palette;
    this.route = route;
    this.routeKey = this.toRouteKey(route);
    this.segment = 0;
    this.progress = Math.random();
    this.speed = 0.1 + Math.random() * 0.08;
    this.frameTimer = 0;
    this.pauseMs = 0;

    const start = route[0];
    this.shadow = scene.add.ellipse(start.x, start.y + 13, 18, 7, 0x000000, 0.22).setDepth(depth - 1);
    this.sprite = scene.add.sprite(start.x, start.y, `worker-${palette}`).setScale(0.92).setDepth(depth);
  }

  setRoute(route) {
    const nextKey = this.toRouteKey(route);
    if (nextKey === this.routeKey) return;
    this.route = route;
    this.routeKey = nextKey;
    this.segment = 0;
    this.progress = 0;
  }

  toRouteKey(route) {
    return route.map((point) => `${point.x},${point.y}`).join("|");
  }

  update(delta) {
    if (this.route.length < 2) return;
    if (this.pauseMs > 0) {
      this.pauseMs -= delta;
      return;
    }

    this.progress += (this.speed * delta) / 1000;
    if (this.progress >= 1) {
      this.progress = 0;
      this.segment = (this.segment + 1) % this.route.length;
      if (this.segment === 1) this.pauseMs = 350 + Math.random() * 650;
    }

    const from = this.route[this.segment];
    const to = this.route[(this.segment + 1) % this.route.length];
    const smooth = Math.min(1, Math.max(0, this.progress * this.progress * (3 - 2 * this.progress)));
    const bob = Math.sin(this.progress * Math.PI * 2) * 1.5;
    const x = from.x + (to.x - from.x) * smooth;
    const y = from.y + (to.y - from.y) * smooth + bob;
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y + 13);
    this.sprite.flipX = to.x < from.x;

    this.frameTimer += delta;
    if (this.frameTimer > 240) {
      this.frameTimer = 0;
      const walking = this.sprite.texture.key.endsWith("-walk");
      this.sprite.setTexture(walking ? `worker-${this.palette}` : `worker-${this.palette}-walk`);
    }
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
