// 아이콘 아틀라스 DOM 헬퍼 — public/art/icons96.png(광택 카툰 아이콘)의 프레임을 CSS 배경으로 쓴다.
// 배경 위치·크기를 퍼센트로 계산하므로 요소의 width/height를 CSS에서 자유롭게 바꿔도 프레임이 유지된다.
import { ICONS, ICON_SHEETS } from "../assets/iconAtlas.js";

export const ICON_DEFAULT_PX = 32;

export function hasIcon(name) {
  return Boolean(ICONS[name]);
}

// background-* 인라인 스타일 문자열 + 기본 크기. size는 CSS px(선택).
export function iconStyle(name, size = ICON_DEFAULT_PX) {
  const entry = ICONS[name];
  if (!entry) return "";
  const [cell, x, y] = entry;
  const sheet = ICON_SHEETS[cell];
  const cols = sheet.width / cell;
  const rows = sheet.height / cell;
  const px = cols > 1 ? (x / cell) / (cols - 1) * 100 : 0;
  const py = rows > 1 ? (y / cell) / (rows - 1) * 100 : 0;
  return `width:${size}px;height:${size}px;background-image:url('${sheet.url}');background-size:${cols * 100}% ${rows * 100}%;background-position:${px}% ${py}%;background-repeat:no-repeat`;
}

// 인라인 <i> 요소 HTML. 없는 이름은 빈 자리(레이아웃 유지)로 렌더.
export function iconHtml(name, { size = ICON_DEFAULT_PX, cls = "", title = "" } = {}) {
  const style = iconStyle(name, size);
  const t = title ? ` title="${title}"` : "";
  if (!style) return `<i class="gp-ic gp-ic--missing ${cls}" data-icon="${name}"${t}></i>`;
  return `<i class="gp-ic ${cls}" data-icon="${name}" style="${style}"${t}></i>`;
}

// 기존 요소에 아이콘을 적용(innerHTML 재생성 없이 갱신할 때).
export function applyIcon(el, name, size = ICON_DEFAULT_PX) {
  if (!el) return;
  el.style.cssText = iconStyle(name, size);
  el.dataset.icon = name;
}

export const facilityIcon = (id) => `fac-${id}`;
export const staffIcon = (id) => `staff-${id}`;
export const tabIcon = (id, active = false) => (active ? `tab-${id}--on` : `tab-${id}`);
export const regionIcon = (area) => `region-${Math.max(1, Math.min(12, Number(area) || 1))}`;
export const bossIcon = (id) => `boss-${id}`;
export const titleIcon = (id) => `title-${id}`;
export const itemIcon = (id) => `item-${id}`;
export const charIcon = (id) => `char-${id}`;
export const eraIcon = (key) => `era-${key}`;
