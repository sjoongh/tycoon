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
  const src = scene.textures.get(ASSET_KEYS.workerSheet).getSourceImage();
  // 실제 워커는 캐릭터별 단일 이미지(다양성 보존). 공유 프레임 애니를 등록하면 모두 같은 텍스처로 바뀌므로
  // 애니를 만들지 않는다. WorkerActor는 anims.exists 가드로 no-op 처리하고 이동+bob/breath로 생동감을 준다.
  if (src && src.height > 48) return;
  // 플레이스홀더(96x32 가로 4프레임 스트립)만 시트화.
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
