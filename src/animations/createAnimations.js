import { ASSET_KEYS } from "../assets/assetManifest.js";

// devPlaceholders가 만든 단일 텍스처를 24px 프레임 시트로 다시 등록
export function registerWorkerSheet(scene) {
  const baseKey = ASSET_KEYS.workerSheet;
  const sheetKey = baseKey + "/sheet";
  if (scene.textures.exists(sheetKey)) return sheetKey;
  const src = scene.textures.get(baseKey).getSourceImage();
  scene.textures.addSpriteSheet(sheetKey, src, { frameWidth: 24, frameHeight: 32 });
  return sheetKey;
}

export function createAnimations(scene) {
  const sheetKey = registerWorkerSheet(scene);
  const def = (key, frames, frameRate, repeat) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: frames.map((f) => ({ key: sheetKey, frame: f })),
      frameRate,
      repeat,
    });
  };
  def("worker-walk", [0, 1], 6, -1);
  def("worker-idle", [0], 1, -1);
  def("worker-work", [2, 3], 5, -1);
}
