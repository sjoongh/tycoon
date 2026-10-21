// 게임 시계 — Date.now()에 서버 보정 오프셋을 더한 단일 시각원. 모든 저장·쿨다운·출석 판정이 이 시계를 쓴다.
// 오프셋은 클라우드 초기화 때 Firestore serverTimestamp 왕복으로 1회 측정한다(실패 시 0 = 로컬 시계).
export const clock = {
  offset: 0,
  measuredAt: 0,
  now() {
    return Date.now() + this.offset;
  },
  setOffset(ms) {
    const v = Number(ms);
    this.offset = Number.isFinite(v) ? Math.round(v) : 0;
    this.measuredAt = Date.now();
  },
  reset() {
    this.offset = 0;
    this.measuredAt = 0;
  },
  calibrated() {
    return this.measuredAt > 0;
  },
};

// 서버 시각 왕복으로 오프셋 추정: 서버가 찍은 시각 + 왕복/2 = 응답을 받은 순간의 서버 시각.
export function offsetFromRoundTrip(serverNowMs, sentAtMs, receivedAtMs) {
  const rtt = Math.max(0, receivedAtMs - sentAtMs);
  return serverNowMs + rtt / 2 - receivedAtMs;
}

// 로컬 시계가 마지막 저장 시각보다 이만큼 과거면 "시계 되감김"으로 본다(출석·오프라인 보상 보류)
export const CLOCK_BACK_TOLERANCE_MS = 60 * 60 * 1000;

export function clockRolledBack(nowMs, lastSavedAtMs, tolerance = CLOCK_BACK_TOLERANCE_MS) {
  const last = Number(lastSavedAtMs) || 0;
  return last > 0 && nowMs < last - tolerance;
}
