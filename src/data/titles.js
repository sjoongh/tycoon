// 국장 칭호(인사 발령) — 뽑기로 획득하는 국장의 직급. 각 칭호가 영구 능력을 주고,
// 중복으로 뽑으면 레벨업(컬렉션 깊이). 대표 칭호는 월드의 국장 캐릭터에 표시(꾸미기).
// 능력 key는 permanentEffectFor와 같은 버킷(cpsPct/clickPct/explainPct/eventPct/offlinePct)에
// 합산되어 기존 수식에 그대로 반영된다. weight 합 = 100.
export const govTitles = [
  { id: "intern",    name: "임시직",   rarity: "common",   weight: 36, effect: { clickPct: 0.02 },   per: "클릭 처리 +2%",  emoji: "🧢" },
  { id: "clerk9",    name: "주무관",   rarity: "common",   weight: 30, effect: { cpsPct: 0.02 },     per: "생산 +2%",      emoji: "📋" },
  { id: "officer",   name: "사무관",   rarity: "uncommon", weight: 18, effect: { explainPct: 0.03 }, per: "해명 +3%",      emoji: "📑" },
  { id: "secretary", name: "서기관",   rarity: "uncommon", weight: 10, effect: { eventPct: 0.04 },   per: "사건 보상 +4%", emoji: "🗂️" },
  { id: "director2", name: "부이사관", rarity: "rare",     weight: 3,  effect: { offlinePct: 0.05 }, per: "오프라인 +5%",  emoji: "🎖️" },
  { id: "director",  name: "이사관",   rarity: "rare",     weight: 3,  effect: { cpsPct: 0.06 },     per: "생산 +6%",      emoji: "👑" },
];

export const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2 };
export const RARITY_LABEL = { common: "일반", uncommon: "고급", rare: "희귀" };
export const RARITY_COLOR = { common: "#94b0c2", uncommon: "#7fc8ff", rare: "#ffd479" };

export function titleById(id) {
  return govTitles.find((t) => t.id === id) || null;
}
