// 국장 꾸미기 액세서리 — 진행 마일스톤으로 해금되고, 장착하면 월드 국장 위에 도트 오버레이로 표시.
// 칭호(능력)와는 별개 축: 순수 외형 커스터마이즈. slot당 하나 장착(hat/face).
// unlock.type은 GameState.checkCosmeticUnlocks가 해석(area/prestigeRuns/trust/totalEvents).
export const cosmetics = [
  { id: "cos-cap",    name: "빨간 모자", slot: "hat",  emoji: "🧢", unlock: { type: "area", value: 2 },         hint: "2구역 도달" },
  { id: "cos-tophat", name: "중절모",   slot: "hat",  emoji: "🎩", unlock: { type: "prestigeRuns", value: 1 }, hint: "첫 감사" },
  { id: "cos-halo",   name: "후광",     slot: "hat",  emoji: "😇", unlock: { type: "trust", value: 95 },       hint: "믿음 95%" },
  { id: "cos-shades", name: "선글라스", slot: "face", emoji: "🕶️", unlock: { type: "area", value: 5 },         hint: "5구역 도달" },
  { id: "cos-mask",   name: "마스크",   slot: "face", emoji: "😷", unlock: { type: "totalEvents", value: 30 }, hint: "사건 30건 처리" },
];

export const COSMETIC_SLOTS = ["hat", "face"];

export function cosmeticById(id) {
  return cosmetics.find((c) => c.id === id) || null;
}
