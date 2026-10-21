// 캔버스는 DPR배(main.js RENDER_SCALE), 월드 좌표는 390x844. 카메라 줌 z에서 월드 (0,0)이 화면 (0,0)에 오도록 스크롤 베이스를 둔다.
import { GAME_HEIGHT, GAME_WIDTH } from "../config.js";

export function applyRenderScale(scene) {
  const z = scene.registry.get("renderScale") || 1;
  const cam = scene.cameras.main;
  cam.setZoom(z);
  // Phaser는 줌을 뷰포트 중심 기준으로 적용: 보이는 월드 폭 = W*z/z = W. 중심을 (W/2, H/2)에 맞추면 월드 (0,0)=화면 (0,0).
  cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  return { zoom: z, baseScrollX: cam.scrollX, baseScrollY: cam.scrollY };
}
