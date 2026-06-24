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
  // 실제 아트(단일 클럭 이미지)면 시트 슬라이싱/애니 생성을 건너뛴다. 플레이스홀더(작은 4프레임 스트립)만 시트화.
  // 플레이스홀더는 96x32 가로 4프레임 스트립(높이 32). 실제 단일 클럭은 세로로 김(높이 큼) → 시트화 건너뜀.
  const src = scene.textures.get(ASSET_KEYS.workerSheet).getSourceImage();
  if (src && src.height > 48) return;
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
