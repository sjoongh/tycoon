// 국장 꾸미기 액세서리 — 진행 마일스톤으로 해금되고, 장착하면 월드 국장 위에 도트 오버레이로 표시.
// 칭호(능력)와는 별개 축: 순수 외형 커스터마이즈. slot당 하나 장착(hat/face).
// unlock.type은 GameState.checkCosmeticUnlocks가 해석(area/prestigeRuns/trust/totalEvents). season 은 시즌 트랙 지급 전용.
export const cosmetics = [
  { id: "cos-cap",    name: "빨간 모자", slot: "hat",  icon: "cos-cap", unlock: { type: "area", value: 2 },         hint: "2구역 도달" },
  { id: "cos-tophat", name: "중절모",   slot: "hat",  icon: "cos-tophat", unlock: { type: "prestigeRuns", value: 1 }, hint: "첫 감사" },
  { id: "cos-halo",   name: "후광",     slot: "hat",  icon: "cos-halo", unlock: { type: "trust", value: 95 },       hint: "믿음 95%" },
  { id: "cos-shades", name: "선글라스", slot: "face", icon: "cos-shades", unlock: { type: "area", value: 5 },         hint: "5구역 도달" },
  { id: "cos-mask",   name: "마스크",   slot: "face", icon: "cos-mask", unlock: { type: "totalEvents", value: 30 }, hint: "사건 30건 처리" },
  // 시즌 한정 모자 — 월간 시즌 무료 트랙 240점 단계에서만 받는다. img = 칩에 쓰는 단독 원화(아이콘 아틀라스 밖).
  { id: "cos-s-lamp",   name: "헤드랜턴",   slot: "hat", icon: "ui-star", img: "/art/world/cos-s-lamp-icon.webp",   unlock: { type: "season" }, hint: "밤샘 개표 시즌 한정" },
  { id: "cos-s-boxhat", name: "투표함 모자", slot: "hat", icon: "ui-star", img: "/art/world/cos-s-boxhat-icon.webp", unlock: { type: "season" }, hint: "투표함 대행진 시즌 한정" },
  { id: "cos-s-deer",   name: "탐정 모자",  slot: "hat", icon: "ui-star", img: "/art/world/cos-s-deer-icon.webp",   unlock: { type: "season" }, hint: "재검표 소동 시즌 한정" },
  { id: "cos-s-laurel", name: "월계관",    slot: "hat", icon: "ui-star", img: "/art/world/cos-s-laurel-icon.webp", unlock: { type: "season" }, hint: "명예 개표 시즌 한정" },
  { id: "cos-s-press",  name: "기자 중절모", slot: "hat", icon: "ui-star", img: "/art/world/cos-s-press-icon.webp",  unlock: { type: "season" }, hint: "속보 경쟁 시즌 한정" },
  { id: "cos-s-party",  name: "고깔모자",   slot: "hat", icon: "ui-star", img: "/art/world/cos-s-party-icon.webp",  unlock: { type: "season" }, hint: "개표 축제 시즌 한정" },
];

export const COSMETIC_SLOTS = ["hat", "face"];

export function cosmeticById(id) {
  return cosmetics.find((c) => c.id === id) || null;
}
