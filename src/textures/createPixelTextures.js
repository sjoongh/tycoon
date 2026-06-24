export function createPixelTextures(scene) {
  makeWorkerTexture(scene, "worker-yellow", 0xffc857, 0);
  makeWorkerTexture(scene, "worker-yellow-walk", 0xffc857, 1);
  makeWorkerTexture(scene, "worker-blue", 0x7fc8ff, 0);
  makeWorkerTexture(scene, "worker-blue-walk", 0x7fc8ff, 1);
  makeWorkerTexture(scene, "worker-pink", 0xff8e8e, 0);
  makeWorkerTexture(scene, "worker-pink-walk", 0xff8e8e, 1);
  makeWorkerTexture(scene, "worker-green", 0x89d98b, 0);
  makeWorkerTexture(scene, "worker-green-walk", 0x89d98b, 1);
  makeBallotTexture(scene);
  makeSparkTexture(scene);
  makePaperStackTexture(scene);
  makeDataOrbTexture(scene);
}

function makeWorkerTexture(scene, key, bodyColor, frame) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, 24, 30);
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(12, 28, 15, 5);

  const armOffset = frame === 0 ? 0 : 2;
  const legOffset = frame === 0 ? 0 : 2;

  g.fillStyle(0x2b2636);
  g.fillRect(7 - legOffset, 20, 4, 7);
  g.fillRect(13 + legOffset, 20, 4, 7);
  g.fillStyle(bodyColor);
  g.fillRect(6, 13, 12, 11);
  g.fillStyle(0x4b3428);
  g.fillRect(5, 14, 14, 2);
  g.fillRect(5, 23, 14, 2);
  g.fillRect(5 - armOffset, 15, 3, 8);
  g.fillRect(16 + armOffset, 15, 3, 8);
  g.fillStyle(0xfff1d8);
  g.fillRect(7, 4, 10, 10);
  g.fillStyle(0x3a2a24);
  g.fillRect(6, 3, 12, 4);
  g.fillStyle(0x4b3428);
  g.fillRect(9, 8, 2, 2);
  g.fillRect(14, 8, 2, 2);
  g.fillRect(10, 12, 5, 1);
  g.generateTexture(key, 24, 30);
  g.destroy();
}

function makeBallotTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xfff9e8);
  g.fillRect(0, 0, 22, 14);
  g.fillStyle(0x4b3428);
  g.fillRect(0, 0, 22, 2);
  g.fillRect(0, 12, 22, 2);
  g.fillRect(0, 0, 2, 14);
  g.fillRect(20, 0, 2, 14);
  g.fillStyle(0xff8e8e);
  g.fillRect(5, 5, 12, 3);
  g.generateTexture("ballot", 22, 14);
  g.destroy();
}

function makeSparkTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, 18, 18);
  g.fillStyle(0xfff4cf);
  g.fillRect(8, 1, 2, 16);
  g.fillRect(1, 8, 16, 2);
  g.fillStyle(0xffc857);
  g.fillRect(6, 6, 6, 6);
  g.generateTexture("spark", 18, 18);
  g.destroy();
}

function makePaperStackTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, 28, 22);
  [0, 4, 8].forEach((y, index) => {
    g.fillStyle(index === 2 ? 0xfff9e8 : 0xe8ddc8);
    g.fillRect(4, 10 - y, 20, 8);
    g.fillStyle(0x4b3428);
    g.fillRect(4, 10 - y, 20, 2);
    g.fillRect(4, 16 - y, 20, 2);
    g.fillRect(4, 10 - y, 2, 8);
    g.fillRect(22, 10 - y, 2, 8);
  });
  g.fillStyle(0xffc857);
  g.fillRect(10, 5, 9, 2);
  g.generateTexture("paper-stack", 28, 22);
  g.destroy();
}

function makeDataOrbTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, 24, 24);
  g.fillStyle(0x7fc8ff, 0.35);
  g.fillCircle(12, 12, 11);
  g.fillStyle(0x7fc8ff);
  g.fillCircle(12, 12, 6);
  g.fillStyle(0xfff9e8);
  g.fillCircle(9, 8, 2);
  g.generateTexture("data-orb", 24, 24);
  g.destroy();
}
