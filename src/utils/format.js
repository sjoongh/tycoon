export function shortNumber(value) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}만`;
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
