// 국장 칭호(인사 발령) — 뽑기로 획득하는 국장의 직급. 각 칭호가 영구 능력을 주고,
// 중복으로 뽑으면 레벨업(컬렉션 깊이). 대표 칭호는 월드의 국장 캐릭터에 표시(꾸미기).
// 능력 key는 permanentEffectFor와 같은 버킷(cpsPct/clickPct/explainPct/eventPct/offlinePct)에
// 합산되어 기존 수식에 그대로 반영된다. 뽑기 weight 합 = 100.
export const govTitles = [
  { id: "intern",    name: "임시직",   rarity: "common",   weight: 36, effect: { clickPct: 0.02 },   per: "클릭 처리 +2%",  icon: "title-intern" },
  { id: "clerk9",    name: "주무관",   rarity: "common",   weight: 30, effect: { cpsPct: 0.02 },     per: "생산 +2%",      icon: "title-clerk9" },
  { id: "officer",   name: "사무관",   rarity: "uncommon", weight: 18, effect: { explainPct: 0.03 }, per: "해명 +3%",      icon: "title-officer" },
  { id: "secretary", name: "서기관",   rarity: "uncommon", weight: 10, effect: { eventPct: 0.04 },   per: "사건 보상 +4%", icon: "title-secretary" },
  { id: "director2", name: "부이사관", rarity: "rare",     weight: 3,  effect: { offlinePct: 0.05 }, per: "오프라인 +5%",  icon: "title-director2" },
  { id: "director",  name: "이사관",   rarity: "rare",     weight: 3,  effect: { cpsPct: 0.06 },     per: "생산 +6%",      icon: "title-director" },
  // 시즌 발령 — 뽑기에 나오지 않고(weight 0) 월간 시즌 무료 트랙 마지막 단계에서만 받는다(src/data/seasons.js).
  { id: "s-night",   name: "야간 개표관",   rarity: "season", weight: 0, effect: { offlinePct: 0.03 }, per: "오프라인 +3%",  icon: "ui-star" },
  { id: "s-ballot",  name: "투표함 수호관", rarity: "season", weight: 0, effect: { cpsPct: 0.03 },     per: "생산 +3%",      icon: "ui-star" },
  { id: "s-recount", name: "재검표관",     rarity: "season", weight: 0, effect: { eventPct: 0.04 },   per: "사건 보상 +4%", icon: "ui-star" },
  { id: "s-laurel",  name: "명예 개표관",   rarity: "season", weight: 0, effect: { explainPct: 0.03 }, per: "해명 +3%",      icon: "ui-star" },
  { id: "s-press",   name: "속보 개표관",   rarity: "season", weight: 0, effect: { clickPct: 0.03 },   per: "클릭 처리 +3%", icon: "ui-star" },
  { id: "s-party",   name: "축제 개표관",   rarity: "season", weight: 0, effect: { cpsPct: 0.03 },     per: "생산 +3%",      icon: "ui-star" },
];

// 뽑기 대상(시즌 발령 제외)
export const gachaTitles = govTitles.filter((t) => t.weight > 0);

export const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, season: 3 };
export const RARITY_LABEL = { common: "일반", uncommon: "고급", rare: "희귀", season: "시즌" };
export const RARITY_COLOR = { common: "#94b0c2", uncommon: "#7fc8ff", rare: "#ffd479", season: "#ff9ad5" };

export function titleById(id) {
  return govTitles.find((t) => t.id === id) || null;
}
