// 아이콘 아틀라스 DOM 헬퍼 — 이모지·도트맵 SVG 대신 public/art/icons{16,32}.png 의 프레임을 쓴다.
// 전역 2x 정수 배율(설계 §4.5). 16px 아이콘은 32 CSS px, 32px 아이콘은 64 CSS px로 표시된다.
import { ICONS, ICON_SHEETS } from "../assets/iconAtlas.js";

export const ICON_SCALE = 2;

export function hasIcon(name) {
  return Boolean(ICONS[name]);
}

// background-* 인라인 스타일 문자열. 기존 .gp-chip__ic / .gp-fac__icon 같은 배경 아이콘 요소에 그대로 넣는다.
export function iconStyle(name, scale = ICON_SCALE) {
  const entry = ICONS[name];
  if (!entry) return "";
  const [size, x, y] = entry;
  const sheet = ICON_SHEETS[size];
  const s = size * scale;
  return `width:${s}px;height:${s}px;background-image:url('${sheet.url}');background-size:${sheet.width * scale}px ${sheet.height * scale}px;background-position:-${x * scale}px -${y * scale}px;background-repeat:no-repeat;image-rendering:pixelated`;
}

// 인라인 <i> 요소 HTML. 텍스트 옆에 끼울 때 사용. 없는 이름은 빈 자리(레이아웃 유지)로 렌더.
export function iconHtml(name, { scale = ICON_SCALE, cls = "", title = "" } = {}) {
  const style = iconStyle(name, scale);
  const t = title ? ` title="${title}"` : "";
  if (!style) return `<i class="gp-ic gp-ic--missing ${cls}" data-icon="${name}"${t}></i>`;
  return `<i class="gp-ic ${cls}" data-icon="${name}" style="${style}"${t}></i>`;
}

// 기존 요소에 아이콘을 적용(innerHTML 재생성 없이 갱신할 때).
export function applyIcon(el, name, scale = ICON_SCALE) {
  if (!el) return;
  el.style.cssText = iconStyle(name, scale);
  el.dataset.icon = name;
}

// 데이터 파일의 이모지/도트 키를 아틀라스 이름으로 매핑하는 어댑터들.
export const facilityIcon = (id) => `fac-${id}`;
export const staffIcon = (id) => `staff-${id}`;
export const tabIcon = (id, active = false) => (active ? `tab-${id}--on` : `tab-${id}`);
export const regionIcon = (area) => `region-${Math.max(1, Math.min(12, Number(area) || 1))}`;
export const bossIcon = (id) => `boss-${id}`;
export const titleIcon = (id) => `title-${id}`;
export const cosmeticIcon = (id) => id.replace(/^cos-/, "cos-");
export const itemIcon = (id) => `item-${id}`;
export const charIcon = (id) => `char-${id}`;
export const eraIcon = (key) => `era-${key}`;
