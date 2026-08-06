export const BOSS_DURATION_MS = 8000;
export const BOSS_REWARD_BONUS_PCT = 0.35;
export const BOSS_PATTERN_VERSION = 1;

export const BOSS_PATTERN_COPY = {
  rapid: {
    label: "연타 처리전",
    instruction: "화면이나 처리 도장을 빠르게 연타하세요.",
  },
  alternate: {
    label: "좌우 교대 검인",
    instruction: "빛나는 쪽부터 왼쪽·오른쪽을 번갈아 누르세요.",
  },
  timing: {
    label: "타이밍 봉인",
    instruction: "표식이 NOW 구간에 들어오면 봉인하세요.",
  },
};

const phase = (type, target, options = {}) => ({
  type,
  target,
  ...BOSS_PATTERN_COPY[type],
  ...options,
});

export const checkpointBosses = [
  {
    id: "district-inspection",
    icon: "🔎",
    title: "구청장 현장 점검",
    desc: "밀린 표를 빠르게 찍어 누락 의혹을 끝내세요.",
    phases: [phase("rapid", 8)],
  },
  {
    id: "recount-surge",
    icon: "📣",
    title: "재검표 요구 폭주",
    desc: "양쪽 검인대를 번갈아 잠가 재검표를 마치세요.",
    phases: [phase("alternate", 6)],
  },
  {
    id: "national-observers",
    icon: "👁",
    title: "전국 참관단 도착",
    desc: "참관단이 보는 앞에서 정확한 순간에 기록을 봉인하세요.",
    phases: [phase("timing", 2, { periodMs: 1200, windowPct: 0.34 })],
  },
  {
    id: "central-auditor",
    icon: "⚖",
    title: "중앙 감사관 급습",
    desc: "긴급 처리 뒤 좌우 장부까지 교차 검인하세요.",
    phases: [phase("rapid", 5), phase("alternate", 4)],
  },
  {
    id: "satellite-verification",
    icon: "📡",
    title: "위성 중계 검증",
    desc: "중계 장부를 교대로 확인하고 송출 순간에 봉인하세요.",
    phases: [phase("alternate", 4), phase("timing", 1, { periodMs: 1100, windowPct: 0.3 })],
  },
  {
    id: "time-bureau",
    icon: "⏱",
    title: "시간감사국 최종 심문",
    desc: "세 가지 검증을 연속 돌파해 최종 기록을 확정하세요.",
    phases: [
      phase("rapid", 4),
      phase("alternate", 4),
      phase("timing", 1, { periodMs: 1000, windowPct: 0.28 }),
    ],
  },
];

export function isCheckpointArea(area) {
  const value = Math.floor(Number(area) || 0);
  return value >= 3 && value % 3 === 0;
}

export function bossForArea(area) {
  const normalizedArea = Math.floor(Number(area) || 0);
  if (!isCheckpointArea(normalizedArea)) return null;
  const checkpoint = Math.floor(normalizedArea / 3);
  const definition = checkpointBosses[(checkpoint - 1) % checkpointBosses.length];
  const cycle = Math.floor((checkpoint - 1) / checkpointBosses.length) + 1;
  return { ...definition, area: normalizedArea, checkpoint, cycle };
}

export function bossPatternTarget(definition) {
  return (definition?.phases || []).reduce((sum, item) => {
    return sum + Math.max(0, Math.floor(Number(item?.target) || 0));
  }, 0);
}

export function bossTargetFor({ cps = 0, clickPower = 0 } = {}) {
  const passive = Math.max(0, Number(cps) || 0) * (BOSS_DURATION_MS / 1000);
  const active = Math.max(0, Number(clickPower) || 0) * 12;
  return Math.max(40, Math.ceil(passive + active));
}

export function bossRewardBonus(baseReward) {
  return Math.max(0, Math.floor((Number(baseReward) || 0) * BOSS_REWARD_BONUS_PCT));
}
