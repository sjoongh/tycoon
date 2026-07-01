// 외신 반응 — 믿음 수준에 따라 뜨는 '가상 외신' 헤드라인(풍자·블랙코미디, 정치 중립).
// ⚠️ 실존 국가·언론사·인물 지목 0. 매체명은 전부 가상. 공개 이슈 각색이 아닌 순수 창작.
// tone: praise(사이다 극찬) / neutral / mock(조롱·블랙코미디)
export const worldPress = {
  // 믿음 높음(신뢰 보너스) — 속 시원한 극찬(사이다)
  praise: [
    { outlet: "글로벌 데일리", text: "세계가 감탄한 개표 — '투명함의 교과서'" },
    { outlet: "인터내셔널 타임스", text: "'가장 믿음직한 개표국' 1면 특집" },
    { outlet: "월드 프레스", text: "'개표가 예술이 됐다' 극찬 세례" },
    { outlet: "코스모 뉴스", text: "타국 선관들 '벤치마킹하러 왔다'" },
    { outlet: "가상 통신(WNA)", text: "'신뢰 만렙 개표국'에 표심이 몰린다" },
  ],
  // 보통 — 무난·데면데면
  neutral: [
    { outlet: "글로벌 데일리", text: "개표국 근황: '그럭저럭 굴러간다'" },
    { outlet: "월드 프레스", text: "'특별한 소식 없음'... 이게 칭찬일까?" },
    { outlet: "코스모 뉴스", text: "개표 진행 중 — 관망하는 세계" },
  ],
  // 믿음 낮음(위기) — 조롱 + 블랙코미디(사회주의국이 좋아함)
  mock: [
    { outlet: "이웃 사회주의국 관영 '붉은개표보'", text: "'이것이 인민의 개표다' 대서특필... 우리가 왜 거기 실려?" },
    { outlet: "인민개표일보(가상)", text: "'체제 전환 임박?' 1면... 아직 아닙니다만" },
    { outlet: "글로벌 데일리", text: "'개표가 코미디쇼로' 혹평" },
    { outlet: "월드 프레스", text: "'믿음 바닥, 소쿠리 재소환?' 우려 보도" },
    { outlet: "가상 통신(WNA)", text: "'저 나라 개표, 지켜보기 무섭다' 특파원" },
  ],
  // 공산화 게이지 상승 중 — 블랙코미디 강화(체제 전복 임박)
  collapse: [
    { outlet: "붉은개표보(가상)", text: "'동무들, 곧 우리 편?' 환영 성명 준비 중" },
    { outlet: "인민개표일보(가상)", text: "'개표국 인민화 초읽기' 호외 발행" },
    { outlet: "월드 프레스", text: "'믿음 제로 임박 — 체제가 흔들린다' 긴급타전" },
  ],
};

// 현재 상태에 맞는 외신 반응 하나 뽑기.
export function pickPress(trustState, commPct) {
  let pool;
  if (commPct >= 0.33) pool = worldPress.collapse;            // 전복 위기 우선
  else if (trustState === "bonus") pool = worldPress.praise;  // 사이다
  else if (trustState === "crisis") pool = worldPress.mock;   // 조롱
  else pool = worldPress.neutral;
  const tone = pool === worldPress.praise ? "praise" : (pool === worldPress.neutral ? "neutral" : "mock");
  const item = pool[(Math.random() * pool.length) | 0];
  return { ...item, tone };
}
