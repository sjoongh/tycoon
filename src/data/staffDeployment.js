import { staffDefinitions } from "./staff.js";

export const STAFF_SLOT_LIMIT = 3;

export const STAFF_RANKS = [
  { tier: 5, minLevel: 20, name: "선임관" },
  { tier: 4, minLevel: 15, name: "서기관" },
  { tier: 3, minLevel: 10, name: "사무관" },
  { tier: 2, minLevel: 5, name: "주무관" },
  { tier: 1, minLevel: 1, name: "수습" },
  { tier: 0, minLevel: 0, name: "미채용" },
];

export const STAFF_DEPLOYMENT_EFFECTS = {
  clerk: { key: "clickFlat", perRank: 1, label: "탭 처리" },
  auditor: { key: "eventGuardPct", perRank: 0.06, label: "사건 불신 방어" },
  runner: { key: "feverChargePct", perRank: 0.04, label: "피버 열기" },
  engineer: { key: "cpsPct", perRank: 0.03, label: "자동 생산" },
  analyst: { key: "eventPct", perRank: 0.04, label: "사건 보상" },
  speaker: { key: "explainPct", perRank: 0.04, label: "해명 생산" },
};

export function staffRankForLevel(level) {
  const normalized = Math.max(0, Math.floor(Number(level) || 0));
  return STAFF_RANKS.find((rank) => normalized >= rank.minLevel);
}

export function staffDeploymentDefinition(id) {
  return STAFF_DEPLOYMENT_EFFECTS[id] || null;
}

export function staffDeploymentBonusFor(id, level) {
  const definition = staffDeploymentDefinition(id);
  if (!definition) return 0;
  return definition.perRank * staffRankForLevel(level).tier;
}

export function staffDeploymentEffectText(id, level) {
  const definition = staffDeploymentDefinition(id);
  if (!definition) return "배치 보너스 없음";
  const value = staffDeploymentBonusFor(id, level);
  if (definition.key === "clickFlat") return `${definition.label} +${value}`;
  return `${definition.label} +${Math.round(value * 100)}%`;
}

export function normalizeStaffSlots(value, staffLevels = {}, { autofill = false } = {}) {
  const validIds = new Set(staffDefinitions.map((staff) => staff.id));
  const slots = [];
  const candidates = Array.isArray(value) ? value : [];
  for (const id of candidates) {
    if (slots.length >= STAFF_SLOT_LIMIT) break;
    if (!validIds.has(id) || slots.includes(id) || !(Number(staffLevels?.[id]) > 0)) continue;
    slots.push(id);
  }
  if (autofill) {
    for (const staff of staffDefinitions) {
      if (slots.length >= STAFF_SLOT_LIMIT) break;
      if (Number(staffLevels?.[staff.id]) > 0 && !slots.includes(staff.id)) slots.push(staff.id);
    }
  }
  return slots;
}

export function staffDeploymentEffectFor(data, key) {
  const slots = normalizeStaffSlots(data?.staffSlots, data?.staff);
  return slots.reduce((sum, id) => {
    const definition = staffDeploymentDefinition(id);
    if (definition?.key !== key) return sum;
    return sum + staffDeploymentBonusFor(id, data?.staff?.[id]);
  }, 0);
}
