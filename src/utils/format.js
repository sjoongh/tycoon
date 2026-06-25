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
