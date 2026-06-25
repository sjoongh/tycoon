// 로컬 재방문 알림 매니저.
// 플랫폼 한계(정직): 웹은 푸시 서버 없이 '앱이 완전히 닫힌 동안' 알림을 신뢰성 있게 띄울 수 없다.
// 유일한 클라이언트-only 경로는 Notification Triggers API(TimestampTrigger)이며 대부분 브라우저에서 미탑재.
// → 권한 플로우 + 토글 + (지원 시) Triggers 예약을 제공하고, 미지원/거부 환경에서는 0에러로 안전 무동작.
const MUTE_KEY = "gp-notif-muted";
const ASKED_KEY = "gp-notif-asked";

export class Notifications {
  constructor(gameState) {
    this.gameState = gameState;
  }

  supported() {
    return typeof window !== "undefined" && "Notification" in window;
  }
  triggersSupported() {
    return typeof window !== "undefined" && "TimestampTrigger" in window;
  }
  permission() {
    return this.supported() ? Notification.permission : "unsupported";
  }
  granted() {
    return this.permission() === "granted";
  }
  asked() {
    try { return localStorage.getItem(ASKED_KEY) === "1"; } catch { return false; }
  }
  muted() {
    try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
  }
  setMuted(m) {
    try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch {}
    if (!m) this.schedule(); // 다시 켜면 즉시 재예약
  }
  enabled() {
    return this.granted() && !this.muted();
  }

  // 한 번만 정중히 요청(첫 프레스티지 등 이후). 거부해도 재요청 안 함.
  async requestPermission() {
    try { localStorage.setItem(ASKED_KEY, "1"); } catch {}
    if (!this.supported()) return "unsupported";
    try {
      const p = await Notification.requestPermission();
      if (p === "granted") this.schedule();
      return p;
    } catch {
      return "denied";
    }
  }

  // 재방문 알림 예약(닫힌 앱 대상 — Triggers 지원 시에만 신뢰성; 미지원은 안전 무동작).
  async schedule() {
    if (!this.enabled() || !this.triggersSupported()) return;
    let reg;
    try { reg = await navigator.serviceWorker?.getRegistration(); } catch { return; }
    if (!reg || typeof reg.showNotification !== "function") return;
    // 이전 예약 정리(best-effort)
    try {
      const prev = await reg.getNotifications({ includeTriggered: true });
      prev.filter((n) => (n.tag || "").startsWith("gp-reengage")).forEach((n) => n.close());
    } catch {}
    const now = Date.now();
    for (const r of this._reminderTimes(now)) {
      try {
        await reg.showNotification(r.title, {
          body: r.body,
          tag: "gp-reengage-" + r.id,
          icon: "/icon.svg",
          showTrigger: new TimestampTrigger(r.at),
        });
      } catch {}
    }
  }

  _reminderTimes(now) {
    const gs = this.gameState;
    const out = [];
    // 오프라인 정산 한도 도달
    const cap = gs.offlineCapMsFor ? gs.offlineCapMsFor(gs.data) : 8 * 3600000;
    out.push({ id: "cap", at: now + cap, title: "개표함이 가득 찼어요", body: "오프라인 정산이 한도에 도달했습니다. 돌아와 수령하세요!" });
    // 다음 자정(일일 출석/퀘스트)
    const mid = new Date();
    mid.setHours(24, 0, 5, 0);
    out.push({ id: "daily", at: mid.getTime(), title: "오늘의 출석 보상", body: "개표국에 들러 출석 보상과 일일 퀘스트를 받으세요." });
    // 장시간 유휴(~6h)
    out.push({ id: "idle", at: now + 6 * 3600000, title: "개표국이 기다립니다", body: "표가 쌓이고 있어요. 잠깐 들러 부서를 키워보세요." });
    return out.filter((r) => r.at > now + 60000);
  }
}
