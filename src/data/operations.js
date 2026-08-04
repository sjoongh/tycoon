export const OPERATION_MAX_LEVEL = 99;

export const OPERATION_FAMILIES = {
  tap: { label: "현장", color: "gold" },
  build: { label: "운영", color: "green" },
  response: { label: "대응", color: "red" },
};

// 감사 전까지 누적되는 런 전용 작전. 효과는 레벨당 가산해 기존 경제 버킷과 합성한다.
export const operationDefinitions = [
  {
    id: "manual-count",
    family: "tap",
    icon: "✋",
    name: "수검표 총력전",
    benefit: "탭 기본 처리 +1 · 탭 열기 +0.4",
    effects: { clickFlat: 1, tapHeat: 0.4 },
  },
  {
    id: "combo-shift",
    family: "tap",
    icon: "🔥",
    name: "손가락 비상근무",
    benefit: "콤보 +75ms/+20% · 마일스톤 열기 +5",
    effects: { comboWindowMs: 75, comboBonusPct: 0.2, comboHeat: 5 },
  },
  {
    id: "night-shift",
    family: "build",
    icon: "🌙",
    name: "야간 교대",
    benefit: "기본 생산 +10% · 증설 열기 +2",
    effects: { cpsPct: 0.1, upgradeHeat: 2 },
  },
  {
    id: "paperwork",
    family: "build",
    icon: "📑",
    name: "서류 산더미",
    benefit: "해명 +12% · 브리핑 +1초/열기 +6",
    effects: { explainPct: 0.12, briefDurationMs: 1000, briefHeat: 6 },
  },
  {
    id: "open-briefing",
    family: "response",
    icon: "📣",
    name: "정면 돌파",
    benefit: "사건 보상 +15% · 대응 열기 +8",
    effects: { eventPct: 0.15, eventHeat: 8 },
  },
  {
    id: "field-team",
    family: "response",
    icon: "🎯",
    name: "현장 수거반",
    benefit: "황금 투표함 +25% · 수거 열기 +10",
    effects: { goldenPct: 0.25, fieldHeat: 10 },
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
