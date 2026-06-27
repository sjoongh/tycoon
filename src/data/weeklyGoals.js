// 한정 시즌(주간) 목표 풀. 매주(연-주차) 1개가 결정적으로 선택돼 자동 교체된다(FOMO).
// 목표는 '이번 주 누적 표 처리'. 목표량은 주 시작 시점의 기본 생산(cpsFor)에 hours를 곱해 동적으로 정해
// 진행 단계와 무관하게 항상 도전적이되 달성 가능. 보상은 인장(영구 가치, 자연 스케일).
export const weeklyGoalDefinitions = [
  { id: "w-special", title: "특별 개표 주간", hours: 5, minTarget: 5000, seals: 3 },
  { id: "w-election", title: "대선 개표 주간", hours: 8, minTarget: 20000, seals: 5 },
  { id: "w-urgent", title: "긴급 집계 주간", hours: 3, minTarget: 3000, seals: 2 },
  { id: "w-national", title: "전국 집계 주간", hours: 10, minTarget: 50000, seals: 6 },
  { id: "w-recount", title: "재검표 대비 주간", hours: 6, minTarget: 8000, seals: 4 },
  { id: "w-audit", title: "감사 대비 주간", hours: 7, minTarget: 30000, seals: 5 },
  { id: "w-festival", title: "개표 축제 주간", hours: 4, minTarget: 4000, seals: 3 },
];
