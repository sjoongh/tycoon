// 사건 도감 세트(레퍼런스 로드맵 중기 #6 — 고양이와 스프 컬렉션 세트 보너스 모델).
// 세트의 사건을 모두 수집하면 효과가 영구 적용된다(감사·전복 후에도 도감과 함께 유지). 75개 사건이 정확히 한 세트씩 속한다.
// effect 키는 GameState.dexSetEffectFor(data, key)로 합산된다.
export const dexSets = [
  { id: "office", name: "사무실 소동", effect: { clickPct: 0.10 }, effectText: "탭 처리 +10%",
    events: ["inbox-rush", "lost-stamp", "memo-typo", "meeting-hell", "spilled-drink", "copier-rampage"] },
  { id: "ecosystem", name: "개표국 생태계", effect: { explainPct: 0.10 }, effectText: "해명 생산 +10%",
    events: ["snack-revolt", "coffee-machine", "pigeon-invasion", "office-cat", "ac-broken", "water-cooler"] },
  { id: "overtime", name: "야근 일지", effect: { offlinePct: 0.10 }, effectText: "오프라인 수입 +10%",
    events: ["server-nap", "overtime-snack", "handover-chaos", "vacation-crunch", "dawn-delay"] },
  { id: "press", name: "언론 플레이", effect: { eventPct: 0.15 }, effectText: "사건 보상 +15%",
    events: ["press-visit", "live-stream", "meme-viral", "national-broadcast", "broadcast-bug", "foreign-press"] },
  { id: "fakenews", name: "가짜뉴스 전쟁", effect: { trustDecayPct: 0.10 }, effectText: "믿음 감소 −10%",
    events: ["rumor-online", "fake-news", "comment-army", "undercover-tuber", "phishing-text", "fakenews-backfire"] },
  { id: "recount", name: "재검표 공방", effect: { capacityPct: 0.10 }, effectText: "처리 용량 +10%",
    events: ["recount-demand", "hand-recount-system", "invalid-vote", "exit-poll-miss", "interim-tally"] },
  { id: "ballotbox", name: "투표함 수호", effect: { goldenPct: 0.20 }, effectText: "황금 투표함 보상 +20%",
    events: ["extra-box", "golden-ballot", "ballot-box-custody", "cctv-release", "seal-tampering", "double-lock"] },
  { id: "gear", name: "장비 시비", effect: { cpsPct: 0.05 }, effectText: "생산 +5%",
    events: ["sorter-doubt", "straw-protocol", "paper-quality", "qr-vs-barcode", "writing-tool", "pen-bleed", "accessibility-tool"] },
  { id: "vip", name: "높으신 분들", effect: { sealPct: 0.06 }, effectText: "감사 인장 +6%",
    events: ["vip-visit", "vip-cut-line", "presidential-visit", "nepotism-hire", "summit-protocol"] },
  { id: "field", name: "현장 갈등", effect: { capacityPct: 0.06 }, effectText: "처리 용량 +6%",
    events: ["queue-delay", "observer-note", "angry-protest", "rude-complaint", "basket-incident", "observer-clash"] },
  { id: "crisis", name: "위기 대응", effect: { offlineHr: 1 }, effectText: "오프라인 적립 +1시간",
    events: ["late-tip", "power-outage", "audit-notice", "lost-ballot", "ballot-shortage", "unified-glitch"] },
  { id: "history", name: "역사의 현장", effect: { cpsPct: 0.08 }, effectText: "생산 +8%",
    events: ["famous-office", "intl-observers", "system-digitize", "historic-count", "overseas-vote"] },
  { id: "justice", name: "양심과 정의", effect: { eventPct: 0.10 }, effectText: "사건 보상 +10%",
    events: ["security-audit", "too-clean-stat", "ghost-voter", "blackout-poll", "onsite-catch", "whistle-reward"] },
];

export const dexSetByEvent = Object.fromEntries(dexSets.flatMap((s) => s.events.map((e) => [e, s])));
