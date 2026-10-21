// Phaser 쪽 아이콘 아틀라스 로더 — DOM(src/ui/icon.js)과 같은 시트·좌표를 쓴다.
import { ICONS, ICON_SHEETS } from "./iconAtlas.js";

export const iconSheetKey = (size) => `icons${size}`;

// PreloadScene.preload()에서 호출
export function loadIconSheets(scene) {
  for (const [size, sheet] of Object.entries(ICON_SHEETS)) {
    scene.load.image(iconSheetKey(size), sheet.url);
  }
}

// PreloadScene.create()에서 1회 호출 — 각 아이콘 이름을 시트의 프레임으로 등록
export function registerIconFrames(scene) {
  for (const [name, [size, x, y]] of Object.entries(ICONS)) {
    const key = iconSheetKey(size);
    if (!scene.textures.exists(key)) continue;
    const tex = scene.textures.get(key);
    if (!tex.has(name)) tex.add(name, 0, x, y, size, size);
  }
}

// scene.add.image(x, y, ...iconRef("res-votes"))
export function iconRef(name) {
  const entry = ICONS[name];
  if (!entry) return [iconSheetKey(16), "__MISSING__"];
  return [iconSheetKey(entry[0]), name];
}
