// 업적 정의. id는 data.achievements 키이자 GameState.checkAchievements가 1회 지급 판정에 사용한다.
// 기존 세이브 호환을 위해 초기 4종(v100/v1000/cps20/trust90) id는 유지하고 상위 티어를 추가했다.
// metric은 GameState.achievementProgress가 해석한다. reward: { explain, votes, trust, seals }.
export const achievementDefinitions = [
  { id: "v100", name: "첫 백 표", desc: "누적 100표 처리", metric: "totalVotes", target: 100, reward: { explain: 15 } },
  { id: "v1000", name: "천 표 개표", desc: "누적 1,000표 처리", metric: "totalVotes", target: 1000, reward: { explain: 30 } },
  { id: "v100k", name: "십만 표 개표소", desc: "누적 100,000표 처리", metric: "totalVotes", target: 100000, reward: { explain: 120 } },
  { id: "v10m", name: "천만 표 개표", desc: "누적 10,000,000표 처리", metric: "totalVotes", target: 10000000, reward: { explain: 400, seals: 1 } },
  { id: "v1b", name: "십억 표 전설", desc: "누적 1,000,000,000표 처리", metric: "totalVotes", target: 1000000000, reward: { explain: 1500, seals: 3 } },
  { id: "cps20", name: "자동 분류 라인", desc: "초당 20표 생산", metric: "cps", target: 20, reward: { explain: 40 } },
  { id: "cps200", name: "고속 분류기", desc: "초당 200표 생산", metric: "cps", target: 200, reward: { explain: 150 } },
  { id: "cps2k", name: "개표 공장", desc: "초당 2,000표 생산", metric: "cps", target: 2000, reward: { explain: 500, seals: 1 } },
  { id: "trust90", name: "신뢰의 국장", desc: "믿음 90% 달성", metric: "trust", target: 90, reward: { explain: 60 } },
  { id: "fac30", name: "부서 정비", desc: "시설 레벨 합계 30", metric: "facilityTotal", target: 30, reward: { explain: 50 } },
  { id: "fac80", name: "개표국 확장", desc: "시설 레벨 합계 80", metric: "facilityTotal", target: 80, reward: { explain: 160 } },
  { id: "area5", name: "광역 개표", desc: "5구역 도달", metric: "area", target: 5, reward: { explain: 120 } },
  { id: "area10", name: "전국 개표", desc: "10구역 도달", metric: "area", target: 10, reward: { explain: 400, seals: 1 } },
  { id: "prestige1", name: "첫 감사", desc: "감사(재정비) 1회 완료", metric: "prestigeRuns", target: 1, reward: { explain: 80 } },
  { id: "prestige5", name: "감사 베테랑", desc: "감사 5회 완료", metric: "prestigeRuns", target: 5, reward: { explain: 300, seals: 2 } },
  { id: "events25", name: "사건 처리반", desc: "사건 25건 처리", metric: "totalEvents", target: 25, reward: { explain: 100 } },
];
