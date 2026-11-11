// 특별 개표소(주간 분리 경제 이벤트) — 레퍼런스 로드맵 중기 #7, Idle Miner Tycoon 이벤트 광산 모델.
// 주(7일) 중 5일 열린다. 전용 통화 '특표'와 전용 시설 3개로 0부터 키우고, 종료 시 특표는 사라지며 달성 등급 보상과 기록만 남는다.
export const SPECIAL_THEMES = [
  { id: "byelection", name: "보궐선거 개표소", stations: ["임시 접수대", "간이 분류대", "속보 상황판"] },
  { id: "overseas", name: "재외국민 투표 개표소", stations: ["항공 우편함", "통역 데스크", "시차 개표반"] },
  { id: "referendum", name: "주민투표 개표소", stations: ["마을회관 탁자", "반상회 집계반", "이장님 확성기"] },
  { id: "student", name: "학생회장 선거 개표소", stations: ["교실 투표함", "선도부 검표반", "방송부 중계"] },
  { id: "coop", name: "조합장 선거 개표소", stations: ["농협 창구", "작목반 집계", "경운기 운반조"] },
];

// 시설: 초당 특표 base×레벨, 비용 cost×1.35^레벨, 앞 시설 Lv.5에서 해금
export const SPECIAL_STATIONS = [
  { base: 1, cost: 10, icon: "fac-desk" },
  { base: 9, cost: 160, icon: "fac-sorter", needPrev: 5 },
  { base: 70, cost: 2800, icon: "fac-studio", needPrev: 5 },
];
export const SPECIAL_COST_GROWTH = 1.35;

// 누적 특표 등급(이번 주). 보상은 메인 경제로 지급.
export const SPECIAL_TIERS = [
  { id: "bronze", name: "브론즈", need: 5000, reward: { explain: 120 } },
  { id: "silver", name: "실버", need: 80000, reward: { explain: 300, seals: 1 } },
  { id: "gold", name: "골드", need: 1500000, reward: { explain: 600, seals: 3 } },
  { id: "elite", name: "엘리트", need: 25000000, reward: { explain: 1200, seals: 6 } },
];

export const SPECIAL_OPEN_DAYS = 5; // 주 7일 중 앞 5일(로컬 기준 목~월) 운영
export const SPECIAL_OFFLINE_RATE = 0.5;
export const SPECIAL_OFFLINE_CAP_H = 8;
