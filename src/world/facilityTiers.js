// 높은 임계값부터 검사
const TIER_THRESHOLDS = [
  { min: 45, tier: "t5" },
  { min: 25, tier: "t4" },
  { min: 12, tier: "t3" },
  { min: 5, tier: "t2" },
  { min: 1, tier: "t1" },
  { min: 0, tier: "locked" },
];

export function tierForLevel(level) {
  const lvl = Math.max(0, Math.floor(Number(level) || 0));
  return TIER_THRESHOLDS.find((entry) => lvl >= entry.min).tier;
}

export function stationSpriteKey(facilityId, tier, variant = "idle") {
  return `facility/${facilityId}/${tier}/${variant}`;
}
