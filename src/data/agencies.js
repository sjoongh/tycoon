// 기관 소집(레퍼런스 로드맵 장기 #2: 훈장이 새 규칙·새 사건군을 여는 열쇠) — 훈장으로 1회 소집하면
// 그 기관의 사건이 일반 사건 사이에 섞여 나온다. 기관 사건은 사건 도감(officeEvents)과 별개로 센다.
// 효과 키: seals(제도인장 즉시) / onAir(초, 생산 ×ON_AIR_MULT 생중계) / cert(국제 인증 점수, CERT_PER_MEDAL점마다 훈장 1).
// 모든 기관·인물·사건은 가상이다.

export const AGENCY_EVENT_CHANCE = 0.3; // 소집한 기관이 있을 때 일반 사건 자리에 기관 사건이 나올 확률
export const ON_AIR_MULT = 3;
export const CERT_PER_MEDAL = 8;

export const AGENCIES = [
  { id: "counsel", upgradeId: "agencyCounsel", name: "특별검사팀", short: "특검", color: "#ff9e7a", cost: 4,
    desc: "특검 사건이 섞여 나온다 · 해결하면 제도인장" },
  { id: "press", upgradeId: "agencyPress", name: "언론 합동취재단", short: "취재단", color: "#7fb8ff", cost: 5,
    desc: `생중계 사건이 섞여 나온다 · 해결하면 생산 ×${ON_AIR_MULT} 생중계` },
  { id: "monitor", upgradeId: "agencyMonitor", name: "국제 선거감시단", short: "감시단", color: "#8fd6a0", cost: 6,
    desc: `감시단 사건이 섞여 나온다 · 인증 ${CERT_PER_MEDAL}점마다 훈장 1` },
];

export const agencyEvents = [
  // 특별검사팀 — 인장
  { id: "ag-counsel-keys", agency: "counsel", title: "특검 압수수색", weight: 1,
    body: "특별검사팀이 보관실 열쇠를 전부 달라고 합니다. 열쇠 꾸러미가 47개입니다.",
    left: ["전부 제출", { seals: 2, explain: -10, trust: 6 }, "해명을 쓰고 인장 2개를 받습니다."],
    right: ["목록만 제출", { seals: 1, votes: 220 }, "개표는 계속되고 인장은 1개입니다."] },
  { id: "ag-counsel-witness", agency: "counsel", title: "참고인 소환", weight: 1,
    body: "특검이 야간조 직원을 참고인으로 부릅니다. 본인은 \"그날 졸았어요\"라고 먼저 말합니다.",
    left: ["동행 출석", { seals: 2, trust: 4, explain: -8 }, "국장이 함께 갑니다."],
    right: ["서면 진술", { seals: 1, explain: 6 }, "서류로 대신합니다."] },
  { id: "ag-counsel-tape", agency: "counsel", title: "봉인 테이프 감식", weight: 1,
    body: "특검 감식반이 봉인 테이프의 지문을 뜹니다. 대부분 국장님 지문입니다.",
    left: ["감식 협조", { seals: 2, trust: 8, votes: -120 }, "작업을 멈추고 협조합니다."],
    right: ["옆 창구 계속", { seals: 1, votes: 260, trust: -3 }, "감식 옆에서 개표를 이어 갑니다."] },
  { id: "ag-counsel-brief", agency: "counsel", title: "특검 중간 발표", weight: 1,
    body: "특검이 중간 발표를 합니다. 결론은 \"아직 더 봐야 한다\"입니다.",
    left: ["자료 추가 제출", { seals: 2, explain: -12, trust: 5 }, "해명 자료를 더 냅니다."],
    right: ["발표 생중계 시청", { seals: 1, trust: 3 }, "직원들과 같이 봅니다."] },

  // 언론 합동취재단 — 생중계(생산 버프)
  { id: "ag-press-live", agency: "press", title: "개표 생중계 요청", weight: 1,
    body: "합동취재단이 개표 현장을 통째로 생중계하겠답니다. 카메라가 여섯 대입니다.",
    left: ["전 창구 공개", { onAir: 60, trust: 5, explain: -8 }, "60초 생중계 · 해명을 씁니다."],
    right: ["창구 하나만", { onAir: 30, votes: 180 }, "30초 생중계."] },
  { id: "ag-press-vlog", agency: "press", title: "개표 브이로그", weight: 1,
    body: "취재단 막내가 개표국 하루 브이로그를 찍습니다. 첫 컷이 국장님 하품입니다.",
    left: ["다시 찍기", { onAir: 45, trust: 4 }, "45초 생중계."],
    right: ["그대로 송출", { onAir: 60, trust: -4 }, "60초 생중계 · 믿음이 조금 떨어집니다."] },
  { id: "ag-press-caption", agency: "press", title: "속보 자막 오타", weight: 1,
    body: "속보 자막에 '개표국'이 '개포국'으로 나갑니다. 시청자 문의가 쏟아집니다.",
    left: ["정정 요청", { onAir: 40, explain: -6, trust: 6 }, "40초 생중계 · 정정 보도가 나갑니다."],
    right: ["화제 되게 두기", { onAir: 60, votes: 150, trust: -5 }, "60초 생중계."] },
  { id: "ag-press-panel", agency: "press", title: "합동 인터뷰", weight: 1,
    body: "취재단이 직원 셋을 한 화면에 앉힙니다. 셋 다 같은 넥타이를 맸습니다.",
    left: ["국장 직접 출연", { onAir: 50, explain: -10, trust: 7 }, "50초 생중계."],
    right: ["직원끼리", { onAir: 35, explain: 8 }, "35초 생중계 · 해명을 아낍니다."] },

  // 국제 선거감시단 — 인증 점수(훈장)
  { id: "ag-monitor-arrive", agency: "monitor", title: "감시단 도착", weight: 1,
    body: "국제 선거감시단이 도착했습니다. 공항에서 개표국 굿즈부터 샀습니다.",
    left: ["현장 안내", { cert: 2, explain: -10, trust: 5 }, "인증 2점 · 해명을 씁니다."],
    right: ["자료집 전달", { cert: 1, votes: 200 }, "인증 1점."] },
  { id: "ag-monitor-interpret", agency: "monitor", title: "통역 지연", weight: 1,
    body: "통역사가 늦습니다. 감시단이 손짓으로 '이 상자 뭐예요?'를 묻습니다.",
    left: ["상자 열어 보이기", { cert: 2, trust: 6, votes: -100 }, "인증 2점 · 개표를 잠시 멈춥니다."],
    right: ["번역 앱", { cert: 1, trust: 2 }, "인증 1점."] },
  { id: "ag-monitor-check", agency: "monitor", title: "참관 체크리스트", weight: 1,
    body: "감시단 체크리스트가 112항목입니다. 33번은 '직원이 웃는가'입니다.",
    left: ["112항목 전부", { cert: 2, explain: -12, trust: 4 }, "인증 2점."],
    right: ["핵심 20항목", { cert: 1, explain: 5 }, "인증 1점 · 해명을 아낍니다."] },
  { id: "ag-monitor-statement", agency: "monitor", title: "공동 성명 초안", weight: 1,
    body: "감시단이 성명 초안을 보여 줍니다. '대체로 믿을 만하다'의 '대체로'가 신경 쓰입니다.",
    left: ["문구 협의", { cert: 2, explain: -8, trust: 6 }, "인증 2점."],
    right: ["그대로 수용", { cert: 1, votes: 180 }, "인증 1점."] },
];

const agencyById = new Map(AGENCIES.map((a) => [a.id, a]));
const agencyEventMap = new Map(agencyEvents.map((e) => [e.id, e]));

export function agencyDef(id) {
  return agencyById.get(id) || null;
}

export function agencyEventById(id) {
  return agencyEventMap.get(id) || null;
}

// 저장 값 정리: { done: { agencyId: 해결 수 }, seen: { eventId: 1 }, cert: 남은 인증 점수(0~CERT_PER_MEDAL-1) }
export function normalizeAgencyState(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const int = (v) => Math.max(0, Math.floor(Number(v) || 0));
  const done = {};
  for (const a of AGENCIES) done[a.id] = int(s.done?.[a.id]);
  const seen = {};
  if (s.seen && typeof s.seen === "object") for (const id of Object.keys(s.seen)) if (agencyEventMap.has(id)) seen[id] = 1;
  return { done, seen, cert: Math.min(CERT_PER_MEDAL - 1, int(s.cert)) };
}
