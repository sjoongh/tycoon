// 랜덤 아이템 — 가끔 화면에 떨어지고, 탭하면 종류별 보상. 풍자 소재.
export const randomItems = [
  { id: "parcel", icon: "item-parcel", weight: 30 },   // 의문의 택배 → 표
  { id: "doc", icon: "item-doc", weight: 20 },       // 기밀 문서 → 해명
  { id: "balloon", icon: "item-balloon", weight: 18 },   // 응원 답지 → 믿음
  { id: "votes", icon: "item-votes", weight: 22 },     // 숨은 표뭉치 → 표(대)
  { id: "donation", icon: "item-donation", weight: 10 },  // 거액 후원 → 표(특대)+해명
  { id: "coffee", icon: "item-coffee", weight: 14 },     // 야근 커피 → 표(활력)
  { id: "stamp", icon: "item-stamp", weight: 14 },      // 결재 도장 → 표+해명
  { id: "ramen", icon: "item-ramen", weight: 12 },      // 야식 회식 → 표+믿음
  { id: "jackpot", icon: "item-jackpot", weight: 6 },     // 복권 → 대박/꽝 랜덤
  { id: "pigeon", icon: "item-pigeon", weight: 12 },     // 비둘기 소동(러닝개그) → 표+믿음
  { id: "tip", icon: "item-tip", weight: 12 },         // 제보 전화 → 해명+믿음
];

export function pickRandomItem() {
  const total = randomItems.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of randomItems) {
    r -= it.weight;
    if (r < 0) return it;
  }
  return randomItems[0];
}
