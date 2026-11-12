// 헤드라인 스크랩(레퍼런스 로드맵 장기 #6): 조건을 만족하면 한 번만 뜨는 희귀 외신 헤드라인.
// Cookie Clicker 뉴스 티커의 조건부 문구 모델. 처음 뜰 때 스크랩북에 영구 기록되고, 모은 수에 따라 생산 보너스가 붙는다.
// ⚠️ 매체·인물·사건 전부 가상. 실존 언론사·정당·인물 지목 0.
//
// on: 판정 시점 — "clock"(약 30초마다 상태·시각 점검) 또는 GameState 이벤트 이름.
// test(gs, ctx, date, totals): 만족하면 true. ctx 는 이벤트 payload(clock 은 {}), totals 는 { dexEvents, seasonSteps }.
// hint: 아직 못 본 칸에 보이는 조건(수집 동기).

export const HEADLINE_CHECK_TICKS = 30; // clock 판정 주기(tick = 1초)

const hour = (d) => d.getHours();
const md = (d) => `${d.getMonth() + 1}-${d.getDate()}`;

export const headlines = [
  // 시각·날짜
  { id: "hl-dawn", outlet: "새벽 통신", text: "'새벽 3시에도 개표 중' 국장 불면증 의혹", hint: "새벽 2~4시에 개표", on: "clock", test: (gs, c, d) => hour(d) >= 2 && hour(d) < 5 },
  { id: "hl-midnight", outlet: "자정 속보", text: "'날짜가 바뀌어도 개표는 계속' 철야 돌입", hint: "자정(0시대)에 개표", on: "clock", test: (gs, c, d) => hour(d) === 0 },
  { id: "hl-lunch", outlet: "점심 특보", text: "'개표원들, 김밥 한 줄로 버텨' 현장 르포", hint: "점심(12시대)에 개표", on: "clock", test: (gs, c, d) => hour(d) === 12 },
  { id: "hl-weekend", outlet: "주말 매거진", text: "'주말에도 출근한 개표국' 노조 술렁", hint: "주말에 개표", on: "clock", test: (gs, c, d) => d.getDay() === 0 || d.getDay() === 6 },
  { id: "hl-newyear", outlet: "신년 특집", text: "'올해도 믿어주세요' 국장 신년사 3초 만에 끝", hint: "1월 1일에 개표", on: "clock", test: (gs, c, d) => md(d) === "1-1" },
  { id: "hl-aprilfool", outlet: "만우절 통신", text: "'개표 결과 전부 거짓말' — 오늘만 믿지 마세요", hint: "4월 1일에 개표", on: "clock", test: (gs, c, d) => md(d) === "4-1" },
  { id: "hl-xmas", outlet: "성탄 특보", text: "'산타 투표함 반입 거부' 출입 기록 없어", hint: "12월 25일에 개표", on: "clock", test: (gs, c, d) => md(d) === "12-25" },
  // 상태
  { id: "hl-trust100", outlet: "글로벌 데일리", text: "'믿음 100%' 개표국, 국제 표준 등재 검토", hint: "믿음 100%", on: "clock", test: (gs) => gs.data.trust >= 99.5 },
  { id: "hl-away", outlet: "가상 통신(WNA)", text: "'국장 실종 8시간'… 투표함은 혼자 잘 돌아갔다", hint: "8시간 넘게 비웠다 복귀", on: "clock", test: (gs) => (gs._sessionOfflineMs || 0) >= 8 * 3600000 },
  { id: "hl-backlog", outlet: "코스모 뉴스", text: "'개표장에 투표함 산' 등산객 몰려", hint: "적체가 처리량 5분분 넘게 쌓임", on: "clock", test: (gs) => { const cap = gs.capacityFor(gs.data); return cap > 0 && (gs.data.backlog || 0) >= cap * 300; } },
  { id: "hl-area10", outlet: "월드 프레스", text: "'10구역 돌파' 지도 제작사 야근 확정", hint: "10구역 도달", on: "clock", test: (gs) => gs.data.stage.area >= 10 },
  // 플레이 순간
  { id: "hl-combo", outlet: "스포츠 개표", text: "'손가락 음속 돌파' 연타 100 콤보 신기록", hint: "연타 콤보 100", on: "combo", test: (gs, c) => c.combo >= 100 },
  { id: "hl-golden", outlet: "행운 일보", text: "'황금 투표함만 열 번째' 국장 로또 의혹", hint: "황금 투표함 10번 열기", on: "golden", test: (gs) => (gs.data.stats.goldenTaps || 0) >= 10 },
  { id: "hl-boss", outlet: "월드 프레스", text: "'검증 보스 격파' 재검표 요구 0건", hint: "보스 검증 성공", on: "boss-end", test: (gs, c) => !!c.success },
  { id: "hl-fever", outlet: "속보 채널", text: "'개표장 축제 분위기' 피버 생중계", hint: "피버 발동", on: "fever-start", test: () => true },
  { id: "hl-cider", outlet: "사이다 신문", text: "'다섯 번째 정면돌파' 탄산 수요 급증", hint: "사이다 5번", on: "cider", test: (gs) => (gs.data.stats.ciders || 0) >= 5 },
  { id: "hl-move", outlet: "이사 통신", text: "'이삿짐 다 풀었다' 새 구역 집들이", hint: "이삿짐 상자 전부 풀기", on: "move-done", test: () => true },
  { id: "hl-prestige", outlet: "감사 일보", text: "'자진 감사' 개표국, 처음부터 다시 센다", hint: "감사 완료", on: "prestige-done", test: () => true },
  { id: "hl-collapse", outlet: "붉은개표보(가상)", text: "'동무들 환영합니다' 개표국 간판 교체", hint: "체제 전복", on: "comm-collapse", test: () => true },
  { id: "hl-elite", outlet: "특별 개표 소식", text: "'특별 개표소 엘리트' 출장 개표 섭외 쇄도", hint: "특별 개표소 엘리트 등급", on: "special-tier", test: (gs, c) => c.id === "elite" },
  { id: "hl-season", outlet: "시즌 특보", text: "'무료 트랙 완주' 국장 시즌 개근상", hint: "시즌 트랙 마지막 단계", on: "season-step", test: (gs, c, d, t) => c.step >= t.seasonSteps - 1 },
  { id: "hl-endings", outlet: "인터내셔널 타임스", text: "'모든 결말을 본 국장' 회고록 계약", hint: "사건 결말 전부 발견", on: "event-chain-ending", test: (gs, c) => c.discovered >= c.total },
  { id: "hl-dexall", outlet: "도서관 신보", text: "'사건 도감 완간' 국립 가상도서관 납본", hint: "사건 도감 전부 수집", on: "clock", test: (gs, c, d, t) => gs.seenEventCount() >= t.dexEvents },
];

// 스크랩 수 → 영구 생산 보너스(사건 도감과 별도로 곱한다). 마지막 단계 = 전부 수집.
export const HEADLINE_MILESTONES = [
  { n: 5, pct: 0.02 },
  { n: 10, pct: 0.04 },
  { n: 15, pct: 0.06 },
  { n: headlines.length, pct: 0.1 },
];

export function headlineBonusFor(count) {
  let pct = 0;
  for (const m of HEADLINE_MILESTONES) if (count >= m.n) pct = m.pct;
  return pct;
}

export const headlineById = (id) => headlines.find((h) => h.id === id) || null;
export const HEADLINE_TRIGGERS = [...new Set(headlines.map((h) => h.on).filter((on) => on !== "clock"))];

// 저장 값 정리: 알려진 id 만, 값은 첫 스크랩 시각(ms)
export function normalizeHeadlines(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, at] of Object.entries(raw)) {
    if (!headlineById(id)) continue;
    const t = Math.floor(Number(at));
    out[id] = Number.isFinite(t) && t > 0 ? t : 1;
  }
  return out;
}
