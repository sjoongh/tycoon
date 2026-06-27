// 로테이팅 일일 퀘스트(자정 리셋). metric은 GameState.dailyQuestProgress가 data.daily 카운터로 해석.
// 보상은 인장 중심(자연 스케일) + 모듈 해명. 완료 시 '받기'로 수동 수령(클레임 연출).
export const dailyQuestDefinitions = [
  { id: "d-clicks", title: "오늘의 접수", desc: "오늘 100번 탭하기", metric: "clicks", target: 100, reward: { explain: 40 } },
  { id: "d-events", title: "오늘의 대응", desc: "오늘 사건 3건 대응하기", metric: "events", target: 3, reward: { explain: 60 } },
  { id: "d-upgrades", title: "오늘의 증설", desc: "오늘 시설 5번 업그레이드하기", metric: "upgrades", target: 5, reward: { seals: 1 } },
  { id: "d-items", title: "오늘의 줍줍", desc: "오늘 필드 아이템 3개 줍기", metric: "items", target: 3, reward: { explain: 50 } },
  { id: "d-newdex", title: "오늘의 도감", desc: "오늘 새 사건 1종 수집하기", metric: "newdex", target: 1, reward: { explain: 45 } },
];
