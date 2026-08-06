export const EVENT_CHAIN_START_CHANCE = 0.35;
export const EVENT_CHAIN_PITY = 2;

const choice = (label, effect, hint) => [label, effect, hint];

export const eventChains = [
  {
    id: "thirteenth-box",
    title: "사라진 제13투표함",
    minStage: 2,
    weight: 5,
    steps: [
      {
        title: "제13투표함",
        body: "목록에는 없는 투표함이 창고 구석에서 발견됐습니다. 겉면에는 '열지 말 것'이라는 포스트잇만 붙어 있습니다.",
        left: choice("봉인부터", { explain: -8, trust: 8 }, "현장을 보존하고 이동 기록부터 찾습니다."),
        right: choice("열어본다", { votes: 260, trust: -5 }, "내용물을 먼저 확인해 처리 속도를 챙깁니다."),
      },
      {
        title: "비어 있는 7분",
        body: "창고 CCTV에서 정확히 7분이 사라졌습니다. 전산 담당자는 모니터와 눈싸움 중입니다.",
        left: choice("원본 공개", { explain: -12, trust: 10 }, "누락 사실까지 공개하고 외부 검증을 부릅니다."),
        right: choice("로그 복구", { votes: 340, trust: -6 }, "내부에서 빠르게 복구한 뒤 개표를 계속합니다."),
      },
      {
        title: "생중계 재검증",
        body: "기자들이 몰려왔습니다. 이제 투표함 처리 방식을 생중계로 확정해야 합니다.",
        left: choice("전량 재검", { explain: -16, trust: 14 }, "느려도 처음부터 끝까지 다시 셉니다."),
        right: choice("표본 검증", { votes: 520, trust: -8 }, "핵심 표본만 확인하고 밀린 개표를 따라잡습니다."),
      },
    ],
    endings: {
      left: {
        id: "thirteenth-box-glass-vault",
        title: "유리 금고",
        body: "제13투표함은 착오로 확인됐고, 전 과정 공개가 새 표준이 됐습니다. 이제 사건 대응 자체가 신뢰 자산입니다.",
        effect: { eventPct: 0.15 },
        effectText: "이번 런 사건 보상 +15%",
        reward: { stagePct: 0.08, explain: 24, trust: 8 },
      },
      right: {
        id: "thirteenth-box-dawn-express",
        title: "새벽 특급",
        body: "의문은 남았지만 밀린 개표를 동틀 무렵 모두 따라잡았습니다. 현장에는 속도 우선 절차가 정착했습니다.",
        effect: { clickFlat: 2 },
        effectText: "이번 런 직접 탭 +2표",
        reward: { stagePct: 0.12, explain: 12, trust: 3 },
      },
      mixed: {
        id: "thirteenth-box-cross-check",
        title: "교차 검증",
        body: "공개와 속도를 번갈아 택한 끝에 이중 확인 절차가 생겼습니다. 화려하진 않아도 개표 흐름이 단단해졌습니다.",
        effect: { cpsPct: 0.1 },
        effectText: "이번 런 초당 생산 +10%",
        reward: { stagePct: 0.1, explain: 18, trust: 6 },
      },
    },
  },
  {
    id: "anonymous-whistle",
    title: "익명의 내부 제보자",
    minStage: 3,
    weight: 4,
    steps: [
      {
        title: "복사기 밑 봉투",
        body: "복사기 밑에서 '국장님만 보세요'라고 적힌 봉투가 나왔습니다. 안에는 수상한 결재 번호가 빼곡합니다.",
        left: choice("제보자 보호", { explain: -10, trust: 9 }, "신원을 묻지 않고 증거부터 격리합니다."),
        right: choice("신원 확인", { votes: 300, trust: -5 }, "누가 보냈는지부터 찾아 조사 속도를 높입니다."),
      },
      {
        title: "절반짜리 증거",
        body: "결재 번호 절반은 진짜지만 나머지는 커피 주문표였습니다. 제보자가 급했던 모양입니다.",
        left: choice("끝까지 대조", { explain: -14, trust: 11 }, "밤을 새워 원본과 한 줄씩 맞춥니다."),
        right: choice("핵심만 발표", { votes: 420, trust: -7 }, "확실한 부분부터 공개해 여론을 선점합니다."),
      },
      {
        title: "아침 9시 마감",
        body: "감사 보고와 기자 브리핑 마감이 동시에 닥쳤습니다. 한쪽 서류에는 반드시 커피 얼룩이 남습니다.",
        left: choice("감사 보고", { explain: -18, trust: 14 }, "정식 절차로 문제와 개선안을 함께 올립니다."),
        right: choice("긴급 브리핑", { votes: 560, trust: -8 }, "카메라 앞에서 먼저 핵심을 발표합니다."),
      },
    ],
    endings: {
      left: {
        id: "anonymous-whistle-shield",
        title: "제보자 방패",
        body: "제보자는 끝내 익명으로 남았고 내부 신고 절차가 정비됐습니다. 해명 서류가 이전보다 빠르게 쌓입니다.",
        effect: { explainPct: 0.18 },
        effectText: "이번 런 초당 해명 +18%",
        reward: { stagePct: 0.07, explain: 34, trust: 9 },
      },
      right: {
        id: "anonymous-whistle-headline",
        title: "헤드라인 선점",
        body: "브리핑은 모든 아침 뉴스를 차지했습니다. 현장은 빠르게 움직이지만 다음 질문도 더 빨리 날아옵니다.",
        effect: { clickFlat: 1, eventPct: 0.08 },
        effectText: "이번 런 직접 탭 +1표 · 사건 보상 +8%",
        reward: { stagePct: 0.12, explain: 16, trust: 4 },
      },
      mixed: {
        id: "anonymous-whistle-quiet-fix",
        title: "조용한 시정",
        body: "보도보다 먼저 절차가 고쳐졌습니다. 아무도 박수치진 않았지만 사무실 전체의 처리력이 올랐습니다.",
        effect: { cpsPct: 0.08, eventPct: 0.08 },
        effectText: "이번 런 초당 생산·사건 보상 +8%",
        reward: { stagePct: 0.09, explain: 24, trust: 7 },
      },
    },
  },
  {
    id: "ghost-log",
    title: "서버실의 유령 로그",
    minStage: 4,
    weight: 3,
    steps: [
      {
        title: "03:33 자동 접속",
        body: "퇴근한 직원 계정이 새벽 3시 33분에 접속했습니다. 서버실에서는 프린터만 혼자 종이를 뱉고 있습니다.",
        left: choice("망 분리", { explain: -12, trust: 10 }, "처리를 잠시 늦추고 서버를 격리합니다."),
        right: choice("개표 유지", { votes: 380, trust: -6 }, "읽기 전용으로 돌려 흐름을 유지합니다."),
      },
      {
        title: "퇴직자의 비밀번호",
        body: "접속 계정의 주인은 3년 전에 퇴직했습니다. 비밀번호 힌트는 놀랍게도 'password'였습니다.",
        left: choice("외부 포렌식", { explain: -16, trust: 12 }, "독립 전문가에게 로그 전체를 맡깁니다."),
        right: choice("긴급 패치", { votes: 460, trust: -7 }, "계정을 잠그고 현장에서 즉시 패치합니다."),
      },
      {
        title: "마지막 유령 패킷",
        body: "정체불명의 패킷이 다시 움직입니다. 서버를 내리거나, 추적용 미끼를 던질 마지막 기회입니다.",
        left: choice("완전 재부팅", { explain: -20, trust: 15 }, "모든 연결을 끊고 깨끗한 상태에서 다시 시작합니다."),
        right: choice("미끼 서버", { votes: 620, trust: -9 }, "가짜 서버로 유도하며 개표는 멈추지 않습니다."),
      },
    ],
    endings: {
      left: {
        id: "ghost-log-clean-reboot",
        title: "무결점 재부팅",
        body: "유령 접속은 낡은 자동 작업으로 밝혀졌습니다. 전산 절차를 갈아엎은 덕분에 생산 흐름이 더 안정됐습니다.",
        effect: { cpsPct: 0.12 },
        effectText: "이번 런 초당 생산 +12%",
        reward: { stagePct: 0.08, explain: 28, trust: 9 },
      },
      right: {
        id: "ghost-log-zero-downtime",
        title: "무중단 돌파",
        body: "미끼 서버가 정체불명의 작업을 붙잡는 동안 개표는 한 번도 멈추지 않았습니다. 현장 대응 속도가 붙었습니다.",
        effect: { clickFlat: 1, explainPct: 0.1 },
        effectText: "이번 런 직접 탭 +1표 · 초당 해명 +10%",
        reward: { stagePct: 0.13, explain: 14, trust: 4 },
      },
      mixed: {
        id: "ghost-log-tamed",
        title: "유령 로그 길들이기",
        body: "격리와 추적을 오가며 낡은 작업을 감시 도구로 바꿨습니다. 이후 사건은 더 빨리 자원으로 전환됩니다.",
        effect: { cpsPct: 0.06, eventPct: 0.12 },
        effectText: "이번 런 초당 생산 +6% · 사건 보상 +12%",
        reward: { stagePct: 0.1, explain: 22, trust: 7 },
      },
    },
  },
];

export const eventChainById = (id) => eventChains.find((chain) => chain.id === id) || null;

export const allEventEndings = eventChains.flatMap((chain) => Object.values(chain.endings).map((ending) => ({
  ...ending,
  chainId: chain.id,
  chainTitle: chain.title,
})));

export const eventEndingById = (id) => allEventEndings.find((ending) => ending.id === id) || null;

export function eventChainStepEvent(chain, stepIndex) {
  const step = chain?.steps?.[stepIndex];
  if (!chain || !step) return null;
  return {
    ...step,
    id: `chain:${chain.id}:${stepIndex}`,
    minStage: chain.minStage,
    chainId: chain.id,
    chainTitle: chain.title,
    chainStep: stepIndex,
    chainStepCount: chain.steps.length,
  };
}

export function resolveEventChainEnding(chain, choices) {
  if (!chain || !Array.isArray(choices) || choices.length !== chain.steps.length) return null;
  const leftCount = choices.filter((side) => side === "left").length;
  const route = leftCount === chain.steps.length ? "left" : leftCount === 0 ? "right" : "mixed";
  return { ...chain.endings[route], route, chainId: chain.id, chainTitle: chain.title };
}

export function eventEndingEffectFor(endingIds, key) {
  if (!Array.isArray(endingIds)) return 0;
  return [...new Set(endingIds)].reduce((sum, id) => sum + (eventEndingById(id)?.effect?.[key] || 0), 0);
}
