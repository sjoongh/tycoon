// 게임 시계 — Date.now()에 서버 보정 오프셋을 더한 단일 시각원. 모든 저장·쿨다운·출석 판정이 이 시계를 쓴다.
// 오프셋은 클라우드 초기화 때 Firestore serverTimestamp 왕복으로 1회 측정한다(실패 시 0 = 로컬 시계).
// 측정값은 저장해 두고 다음 실행 때 세이브를 읽기 전에 먼저 적용한다(오프라인 정산이 같은 시각원을 쓰게).
export const CLOCK_OFFSET_KEY = "gaepyo-clock-offset";
// 이보다 작은 차이는 왕복 지연 잡음으로 보고 시각원을 옮기지 않는다
export const CLOCK_OFFSET_MIN_SHIFT_MS = 2000;

export const clock = {
  offset: 0,
  measuredAt: 0,
  now() {
    return Date.now() + this.offset;
  },
  // 새 오프셋을 적용하고 시각원이 움직인 양(ms)을 돌려준다
  setOffset(ms) {
    const v = Number(ms);
    const prev = this.offset;
    this.offset = Number.isFinite(v) ? Math.round(v) : 0;
    this.measuredAt = Date.now();
    return this.offset - prev;
  },
  restore(storage = globalThis.localStorage) {
    try {
      const v = Number(JSON.parse(storage?.getItem(CLOCK_OFFSET_KEY) ?? "null")?.offset);
      if (Number.isFinite(v)) this.offset = Math.round(v);
    } catch {}
  },
  persist(storage = globalThis.localStorage) {
    try { storage?.setItem(CLOCK_OFFSET_KEY, JSON.stringify({ offset: this.offset, at: this.measuredAt })); } catch {}
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
