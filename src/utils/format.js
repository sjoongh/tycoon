export function shortNumber(value) {
  // 무한 인장·복리 프레스티지로 후반 총량이 1e12+를 넘으므로 조/경/해 단위까지 — "숫자가 커지는" 가독성 유지
  if (value >= 1e20) return `${(value / 1e20).toFixed(1)}해`;
  if (value >= 1e16) return `${(value / 1e16).toFixed(1)}경`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}조`;
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}억`;
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)}만`;
  return Math.floor(value).toLocaleString("ko-KR");
}

export function textStyle(size, color) {
  return {
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: `${size}px`,
    color,
    fontStyle: "bold",
  };
}

// 초 → 한국어 기간 표기(두 단위까지). 회수 시간·오프라인 경과 표시용.
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "∞";
  if (seconds < 1) return "1초 미만";
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return h > 0 ? `${d}일 ${h}시간` : `${d}일`;
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  if (m > 0) return sec > 0 ? `${m}분 ${sec}초` : `${m}분`;
  return `${sec}초`;
}

// 초당 수치 표기: 작은 값은 소수(0.33), 중간은 소수 1자리, 1만 이상은 단위 축약.
export function rateNumber(value) {
  const v = Number(value) || 0;
  if (v >= 1e4) return shortNumber(v);
  if (v >= 100) return String(Math.round(v));
  if (v >= 10) return v.toFixed(1).replace(/\.0$/, "");
  return v.toFixed(2).replace(/\.?0+$/, "") || "0";
}
