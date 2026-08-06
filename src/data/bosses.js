export const BOSS_DURATION_MS = 8000;
export const BOSS_REWARD_BONUS_PCT = 0.35;

export const checkpointBosses = [
  {
    id: "district-inspection",
    icon: "🔎",
    title: "구청장 현장 점검",
    desc: "누락표 의혹을 8초 안에 정리하세요.",
  },
  {
    id: "recount-surge",
    icon: "📣",
    title: "재검표 요구 폭주",
    desc: "쏟아지는 재검표 요청을 처리하세요.",
  },
  {
    id: "national-observers",
    icon: "👁",
    title: "전국 참관단 도착",
    desc: "모두가 보는 앞에서 처리력을 증명하세요.",
  },
  {
    id: "central-auditor",
    icon: "⚖",
    title: "중앙 감사관 급습",
    desc: "예고 없는 검증을 정면 돌파하세요.",
  },
  {
    id: "satellite-verification",
    icon: "📡",
    title: "위성 중계 검증",
    desc: "전국 생중계가 끝나기 전에 표를 봉인하세요.",
  },
  {
    id: "time-bureau",
    icon: "⏱",
    title: "시간감사국 최종 심문",
    desc: "시간선이 닫히기 전에 기록을 확정하세요.",
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

export function bossTargetFor({ cps = 0, clickPower = 0 } = {}) {
  const passive = Math.max(0, Number(cps) || 0) * (BOSS_DURATION_MS / 1000);
  const active = Math.max(0, Number(clickPower) || 0) * 12;
  return Math.max(40, Math.ceil(passive + active));
}

export function bossRewardBonus(baseReward) {
  return Math.max(0, Math.floor((Number(baseReward) || 0) * BOSS_REWARD_BONUS_PCT));
}
