// 앰비언트 3종(레퍼런스 로드맵 #10) — 경제 영향 없는 '살아 있는 개표소' 연출의 순수 규칙.
//  · 투표함 반입 차량: 시간당 득표(초당×3600) 임계로 리어카 → 1톤 트럭 → 호송차
//  · 방문객 동시 상한: 방 단계별 4/5/6/6명, 빈 대기 자리 중 창구에 가장 가까운 칸부터
//  · 상주 NPC: 시설 티어 3(Lv.12) 이상이면 담당 시설 옆에 참관인·경찰·기자가 상주(직원 3명 상한과 별개)

export const VEHICLE_TIERS = [
  { tier: 1, name: "리어카", perHour: 0 },
  { tier: 2, name: "1톤 트럭", perHour: 500_000 },
  { tier: 3, name: "호송차", perHour: 10_000_000 },
];

export function vehicleTierFor(perHour) {
  const v = Math.max(0, Number(perHour) || 0);
  let cur = VEHICLE_TIERS[0];
  for (const t of VEHICLE_TIERS) if (v >= t.perHour) cur = t;
  const next = VEHICLE_TIERS.find((t) => t.tier === cur.tier + 1) || null;
  return { ...cur, next };
}

const VISITOR_CAP = [4, 5, 6, 6];
export function visitorCapForStage(stage) {
  return VISITOR_CAP[Math.max(0, Math.min(VISITOR_CAP.length - 1, stage | 0))];
}

// 사용 중인 칸 번호들 → 비어 있는 가장 앞 칸(없으면 -1)
export function freeQueueSlot(taken, cap) {
  const used = new Set(taken);
  for (let k = 0; k < cap; k += 1) if (!used.has(k)) return k;
  return -1;
}

export const RESIDENT_MIN_LEVEL = 12; // 시설 티어 3(facilityTiers t3)
export const RESIDENTS = [
  { facility: "sorter", key: "observer", name: "참관인", lines: ["참관 중입니다", "봉인지 확인 완료", "기록하고 있어요", "절차대로 가시죠"] },
  { facility: "archive", key: "police", name: "경찰", lines: ["질서 유지 중!", "보관함 이상 무", "줄 서 주세요~", "투표함은 안전합니다"] },
  { facility: "studio", key: "reporter", name: "기자", lines: ["현장 생중계 중!", "한 말씀만요!", "속보 준비합니다", "개표율 몇 %죠?"] },
];

// level(id) → 레벨, hasSpot(facility) → 현재 방에 자리가 있는가. 상주할 NPC 목록.
export function activeResidents(level, hasSpot) {
  return RESIDENTS.filter((r) => (level(r.facility) || 0) >= RESIDENT_MIN_LEVEL && hasSpot(r.facility));
}
