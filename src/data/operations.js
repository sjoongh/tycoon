export const OPERATION_MAX_LEVEL = 99;

export const OPERATION_FAMILIES = {
  tap: { label: "현장", color: "gold", icon: "op-tap" },
  build: { label: "운영", color: "green", icon: "op-build" },
  response: { label: "대응", color: "red", icon: "op-response" },
};

export const FEVER_FAMILY_PROFILES = {
  tap: {
    name: "현장 피버",
    icon: "op-tap",
    summary: "탭 ×3 · 생산 ×2",
    description: "연타와 콤보가 폭발합니다. 직접 두드릴수록 가장 강합니다.",
    productionMult: 2,
    clickMult: 3,
  },
  build: {
    name: "운영 피버",
    icon: "op-build",
    summary: "생산 ×5 · 증설 25% 할인",
    description: "자동 생산이 폭주하고 시설·직원 증설비가 잠시 내려갑니다.",
    productionMult: 5,
    clickMult: 1.5,
    discountPct: 0.25,
  },
  response: {
    name: "대응 피버",
    icon: "op-response",
    summary: "생산 ×3 · 사건/수거 보상 ×2",
    description: "사건과 현장 보상이 커지고 브리핑·사건 대기가 즉시 풀립니다.",
    productionMult: 3,
    clickMult: 2,
    responseRewardMult: 2,
  },
};

// 감사 전까지 누적되는 런 전용 작전. 3구역마다 한 번 고르므로 한 레벨의 체감이 분명해야 한다.
export const operationDefinitions = [
  {
    id: "manual-count",
    family: "tap",
    icon: "op-tap",
    name: "수검표 총력전",
    benefit: "한 번 누를 때마다 기본 처리량 +1",
    detail: "탭 열기도 조금 더 빠르게 찹니다.",
    effects: { clickFlat: 1, tapHeat: 0.6 },
  },
  {
    id: "combo-shift",
    family: "tap",
    icon: "op-fire",
    name: "손가락 비상근무",
    benefit: "콤보 유지 시간이 늘고 보너스가 25% 강해짐",
    detail: "25·50·100 콤보에서 열기를 더 얻습니다.",
    effects: { comboWindowMs: 100, comboBonusPct: 0.25, comboHeat: 5 },
  },
  {
    id: "ballot-sprint",
    family: "tap",
    icon: "op-ballot",
    name: "투표지 전력질주",
    benefit: "모든 탭 처리량 +12%",
    detail: "평범한 연타만으로도 열기가 더 빨리 찹니다.",
    effects: { clickPct: 0.12, tapHeat: 0.3 },
  },
  {
    id: "counting-rhythm",
    family: "tap",
    icon: "op-drum",
    name: "개표 리듬",
    benefit: "콤보 마일스톤 표 보상 +20%",
    detail: "긴 콤보를 달성할수록 다음 피버가 가까워집니다.",
    effects: { comboRewardPct: 0.2, comboHeat: 8 },
  },
  {
    id: "night-shift",
    family: "build",
    icon: "op-moon",
    name: "야간 교대",
    benefit: "기본 자동 생산 +15%",
    detail: "시설·직원 증설 때 열기를 더 얻습니다.",
    effects: { cpsPct: 0.15, upgradeHeat: 2 },
  },
  {
    id: "paperwork",
    family: "build",
    icon: "op-files",
    name: "서류 산더미",
    benefit: "해명 생산 +15% · 브리핑 지속 +2초",
    detail: "긴급 브리핑이 열기를 크게 올립니다.",
    effects: { explainPct: 0.15, briefDurationMs: 2000, briefHeat: 8 },
  },
  {
    id: "bulk-contract",
    family: "build",
    icon: "op-box",
    name: "일괄 조달 계약",
    benefit: "시설 증설 비용 4% 절감",
    detail: "증설할 때마다 열기를 추가로 얻습니다.",
    effects: { facilityDiscountPct: 0.04, upgradeHeat: 3 },
  },
  {
    id: "staff-roster",
    family: "build",
    icon: "op-team",
    name: "비상근무 명부",
    benefit: "직원 채용 비용 4% 절감",
    detail: "채용도 운영 피버를 준비하는 행동이 됩니다.",
    effects: { staffDiscountPct: 0.04, upgradeHeat: 3 },
  },
  {
    id: "open-briefing",
    family: "response",
    icon: "op-response",
    name: "정면 돌파",
    benefit: "사건의 표·해명 보상 +20%",
    detail: "사건을 해결하면 열기가 크게 오릅니다.",
    effects: { eventPct: 0.2, eventHeat: 10 },
  },
  {
    id: "field-team",
    family: "response",
    icon: "op-target",
    name: "현장 수거반",
    benefit: "황금 투표함 보상 +35%",
    detail: "현장 수거로 얻는 열기도 크게 늘어납니다.",
    effects: { goldenPct: 0.35, fieldHeat: 12 },
  },
  {
    id: "press-center",
    family: "response",
    icon: "op-mic",
    name: "24시 기자실",
    benefit: "긴급 브리핑 믿음 회복 +2",
    detail: "브리핑 한 번으로 대응 피버에 더 가까워집니다.",
    effects: { briefTrustFlat: 2, briefHeat: 10 },
  },
  {
    id: "hotline",
    family: "response",
    icon: "op-phone",
    name: "민원 직통전화",
    benefit: "사건 대기시간 3초 단축",
    detail: "사건과 현장 수거 모두 열기를 더 채웁니다.",
    effects: { eventCooldownMs: -3000, eventHeat: 5, fieldHeat: 5 },
  },
];

export function operationById(id) {
  return operationDefinitions.find((operation) => operation.id === id) || null;
}

function mix(seed) {
  let value = seed >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return value >>> 0;
}

// 한 장씩 현장/운영/대응 축을 보장해 매 구역 선택지가 서로 다른 플레이 방식을 제안한다.
// 입력만으로 결정되므로 드래프트를 저장하기 전에도 새로고침 시 결과가 흔들리지 않는다.
export function operationChoices(area, runs = 0, picks = {}) {
  const totalPicks = Object.values(picks || {}).reduce((sum, level) => sum + (Number(level) || 0), 0);
  const baseSeed = mix(
    Math.imul(Math.max(1, Math.floor(Number(area) || 1)), 73856093)
      ^ Math.imul(Math.max(0, Math.floor(Number(runs) || 0)) + 1, 19349663)
      ^ Math.imul(totalPicks + 1, 83492791),
  );

  return Object.keys(OPERATION_FAMILIES).map((family, index) => {
    const pool = operationDefinitions.filter((operation) => operation.family === family);
    return pool[mix(baseSeed + Math.imul(index + 1, 2654435761)) % pool.length].id;
  });
}

export function normalizeOperationPicks(picks) {
  const source = picks && typeof picks === "object" ? picks : {};
  return Object.fromEntries(operationDefinitions.map((operation) => [
    operation.id,
    Math.max(0, Math.min(OPERATION_MAX_LEVEL, Math.floor(Number(source[operation.id]) || 0))),
  ]));
}
