// 국장 캐릭터 선택 — 시작 시 고르는 국장. 각자 고유 시그니처 외형(sig 오버레이)과 특성(능력)을 가진다.
// 외형은 5단계 성장 텍스처(gov-1..5)를 공유하되 시그니처로 구분 → 적은 도트로 캐릭터 개성.
// trait.effect는 charEffectFor가 cps/click/event 버킷에 합산(칭호·감사와 같은 방식).
export const characters = [
  { id: "classic",  name: "정석 국장", emoji: "🧑‍💼", desc: "원칙대로 — 사건 대응에 강함", sig: null,           trait: { eventPct: 0.05 }, traitText: "사건 보상 +5%" },
  { id: "hotblood", name: "열혈 국장", emoji: "🔥",     desc: "손이 빠른 행동파",          sig: "sig-band",     trait: { clickPct: 0.10 }, traitText: "클릭 처리 +10%" },
  { id: "calm",     name: "초연 국장", emoji: "🧘",     desc: "흔들리지 않는 자동화",      sig: "sig-glasses",  trait: { cpsPct: 0.05 },   traitText: "생산 +5%" },
];

export function characterById(id) {
  return characters.find((c) => c.id === id) || characters[0];
}
