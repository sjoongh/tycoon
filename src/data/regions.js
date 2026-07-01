// 전국 개표 지도 — 게임 구역(area)을 점층적 권위의 지역 노드에 매핑.
// area 1 = index 0. regions 길이를 넘는 구역은 마지막 "전국구+"로 표시.
export const regions = [
  { name: "동네 경로당", desc: "바둑판 치우고 첫 개표", icon: "🏠" },
  { name: "○○동 주민센터", desc: "민원 폭주의 서막", icon: "🏢" },
  { name: "△△구청 회의실", desc: "구청장이 지켜본다", icon: "🏛" },
  { name: "시청 대강당", desc: "기자단 첫 등장", icon: "🎤" },
  { name: "도청 대광장", desc: "재검표 요구 빗발", icon: "📢" },
  { name: "광역시 체육관", desc: "수만 표가 쏟아진다", icon: "🏟" },
  { name: "국회 앞 광장", desc: "전국이 주목", icon: "🏛" },
  { name: "중앙개표청", desc: "권위의 본진", icon: "⚖️" },
  { name: "전국 통합 개표소", desc: "역사적 동시 개표", icon: "🗳" },
  { name: "중앙 관저 영빈관", desc: "최고위층 방문", icon: "🏯" },
  { name: "국제 참관 개표장", desc: "세계가 지켜본다", icon: "🌐" },
  { name: "우주정거장 개표국", desc: "은하 표심까지", icon: "🛰" },
];

// 구역(area) 밴드를 풍자적 "체제 시대"로 매핑 — 배경/상징/깃발색이 시대마다 바뀐다.
export function eraTheme(area) {
  if (area <= 3) return { key: "force", name: "무력 시대", icon: "⚔" };
  if (area <= 6) return { key: "red", name: "적색 시대", icon: "★" };
  if (area <= 9) return { key: "demo", name: "민주 시대", icon: "🗳" };
  if (area <= 12) return { key: "future", name: "미래 시대", icon: "🛸" };
  if (area <= 15) return { key: "space", name: "우주 시대", icon: "🌌" };
  return { key: "myth", name: "신화 시대", icon: "✨" };
}

export function regionFor(area) {
  const idx = Math.max(0, Math.min(regions.length - 1, area - 1));
  const r = regions[idx];
  // 마지막 지역을 넘어선 끝없는 구역은 +N 표기
  if (area > regions.length) return { ...r, name: `${r.name} +${area - regions.length}` };
  return r;
}
