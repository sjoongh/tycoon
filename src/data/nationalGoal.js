// 전국 합산 목표(레퍼런스 로드맵 장기 #5: 커뮤니티 공동 목표) — 이번 주 전체 플레이어의 사건 대응 수를 합산한다.
// 표는 지수적으로 커져 합산 기준으로 쓰기 어렵다. 사건 대응은 쿨다운 때문에 플레이 시간에 비례하므로 공동 목표 단위로 쓴다.
// 합산에는 닉네임을 정해 랭킹에 점수를 올린 플레이어만 들어간다. 보상은 이번 주 직접 사건을 NATIONAL_MIN_EVENTS건 이상 처리한 사람이 받는다.
export const NATIONAL_MIN_EVENTS = 3;

export const NATIONAL_TIERS = [
  { need: 300, reward: { explain: 60 } },
  { need: 1000, reward: { explain: 120 } },
  { need: 3000, reward: { explain: 200, seals: 1 } },
  { need: 8000, reward: { explain: 300, seals: 2 } },
];

// 한 사람이 한 주에 낼 수 있는 사건 수 상한(45초 쿨다운 × 7일 기준). 손상·조작된 기록이 합산을 부풀리지 않게 자른다.
export const NATIONAL_EVENTS_CAP = Math.ceil((7 * 24 * 3600) / 45);

export function nationalReached(total) {
  return NATIONAL_TIERS.filter((t) => total >= t.need).length;
}

// 받은 단계(from)부터 도달 단계(to) 전까지의 보상 합
export function nationalRewardBetween(from, to) {
  const sum = { explain: 0, seals: 0 };
  for (const t of NATIONAL_TIERS.slice(from, to)) {
    sum.explain += t.reward.explain || 0;
    sum.seals += t.reward.seals || 0;
  }
  return sum;
}

export function normalizeNational(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const int = (v, max = Infinity) => Math.min(max, Math.max(0, Math.floor(Number(v) || 0)));
  const p = r.pending && typeof r.pending === "object" ? r.pending : null;
  return {
    week: int(r.week),
    claimed: int(r.claimed, NATIONAL_TIERS.length),
    seen: int(r.seen, NATIONAL_TIERS.length),
    pending: p && int(p.week) > 0 ? { week: int(p.week), mine: int(p.mine), claimed: int(p.claimed, NATIONAL_TIERS.length) } : null,
  };
}
