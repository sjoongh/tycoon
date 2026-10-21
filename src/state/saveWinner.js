// 세이브 후보(로컬·네이티브 미러·클라우드) 중 하나를 고르는 단일 규칙.
// 1순위 lastSavedAt(최신), 동률(2초 이내)이면 누적 표(stats.totalVotes)가 큰 쪽. 둘 다 없으면 null.
export const SAVE_TIE_WINDOW_MS = 2000;

export function saveRank(save) {
  if (!save || typeof save !== "object") return null;
  return {
    savedAt: Number(save.lastSavedAt) || 0,
    totalVotes: Number(save.stats?.totalVotes) || 0,
  };
}

// a가 b보다 우선이면 true (a를 채택). b가 없으면 true, a가 없으면 false.
export function saveBeats(a, b) {
  const ra = saveRank(a);
  const rb = saveRank(b);
  if (!ra) return false;
  if (!rb) return true;
  if (Math.abs(ra.savedAt - rb.savedAt) > SAVE_TIE_WINDOW_MS) return ra.savedAt > rb.savedAt;
  return ra.totalVotes > rb.totalVotes;
}

export function pickSaveWinner(...candidates) {
  let best = null;
  for (const c of candidates) {
    if (saveBeats(c, best)) best = c;
  }
  return best;
}

// 호출을 모아 ms 뒤 1회만 실행. flush()로 즉시 실행, cancel()로 취소.
export function createDebounced(fn, ms) {
  let timer = null;
  const run = () => { timer = null; fn(); };
  return {
    request() {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(run, ms);
    },
    flush() {
      if (timer !== null) { clearTimeout(timer); run(); }
    },
    cancel() {
      if (timer !== null) { clearTimeout(timer); timer = null; }
    },
    pending() { return timer !== null; },
  };
}
