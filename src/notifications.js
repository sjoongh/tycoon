// 로컬 재방문 알림 매니저 — '받을 것이 있다'형 3종(투표함 가득 참·출석 연속 만료·주간/이벤트 마감), 주 3회 상한.
// Android(Capacitor): @capacitor/local-notifications 로 AlarmManager 예약(비정확 알람 — 정확 알람 권한 없음).
// 웹: 푸시 서버가 없어 닫힌 앱 알림은 Notification Triggers(TimestampTrigger) 지원 브라우저에서만 동작, 미지원은 안전 무동작.
import { Capacitor } from "@capacitor/core";
import { planReminders, reminderSnapshot } from "./state/reminders.js";

const MUTE_KEY = "gp-notif-muted";
const ASKED_KEY = "gp-notif-asked";
const PLAN_KEY = "gp-notif-plan"; // 마지막으로 예약한 [{id, at}]
const SENT_KEY = "gp-notif-sent"; // 실제로 울렸다고 보는 시각 목록(주 3회 상한 계산용)
const CHANNEL_ID = "reminders";
const NATIVE_IDS = { cap: 101, streak: 102, week: 103, special: 104 };

const isNative = () => !!(Capacitor.isNativePlatform && Capacitor.isNativePlatform());
const readJson = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
// Capacitor PermissionState → Notification.permission 표기
const mapPerm = (p) => (p === "granted" ? "granted" : p === "denied" ? "denied" : "default");

export class Notifications {
  constructor(gameState) {
    this.gameState = gameState;
    this.native = isNative();
    this._perm = "default";
    this._plugin = null;
  }

  // 네이티브: 플러그인 로드·권한 상태 캐시·앱 전환 리스너. 웹은 무동작.
  async init() {
    if (!this.native) return;
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      this._plugin = LocalNotifications;
      this._perm = mapPerm((await LocalNotifications.checkPermissions()).display);
      await LocalNotifications.createChannel({ id: CHANNEL_ID, name: "보상 알림", importance: 3 });
    } catch { this._plugin = null; return; }
    try {
      const { App } = await import("@capacitor/app");
      App.addListener("pause", () => { this.schedule().catch(() => {}); });
      App.addListener("resume", () => { this.onResume().catch(() => {}); });
    } catch {}
    await this.onResume();
  }

  supported() {
    if (this.native) return !!this._plugin;
    return typeof window !== "undefined" && "Notification" in window;
  }
  triggersSupported() {
    return typeof window !== "undefined" && "TimestampTrigger" in window;
  }
  permission() {
    if (this.native) return this._plugin ? this._perm : "unsupported";
    return this.supported() ? Notification.permission : "unsupported";
  }
  granted() {
    return this.permission() === "granted";
  }
  // 설정에서 '켜기'로 권한을 요청할 수 있는가(네이티브만 — 웹은 예약 자체가 거의 불가)
  canAsk() {
    return this.native && this.permission() === "default";
  }
  asked() {
    try { return localStorage.getItem(ASKED_KEY) === "1"; } catch { return false; }
  }
  muted() {
    try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
  }
  setMuted(m) {
    try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch {}
    if (m) this._cancelPending().catch(() => {});
    else this.schedule().catch(() => {}); // 다시 켜면 즉시 재예약
  }
  enabled() {
    return this.granted() && !this.muted();
  }

  // 한 번만 정중히 요청(첫 감사 이후·설정 '켜기'). 거부해도 재요청 안 함.
  async requestPermission() {
    try { localStorage.setItem(ASKED_KEY, "1"); } catch {}
    if (!this.supported()) return "unsupported";
    try {
      const p = this.native
        ? (this._perm = mapPerm((await this._plugin.requestPermissions()).display))
        : await Notification.requestPermission();
      if (p === "granted") this.schedule();
      return p;
    } catch {
      return "denied";
    }
  }

  plan(now = Date.now()) {
    return planReminders(reminderSnapshot(this.gameState), now, readJson(SENT_KEY));
  }

  // 앱이 백그라운드로 갈 때 예약. 이전 예약은 지우고 지금 상태로 다시 계산한다.
  async schedule() {
    if (!this.enabled()) return;
    if (this.native) return this._scheduleNative();
    if (!this.triggersSupported()) return;
    let reg;
    try { reg = await navigator.serviceWorker?.getRegistration(); } catch { return; }
    if (!reg || typeof reg.showNotification !== "function") return;
    await this._cancelPending();
    const list = this.plan();
    for (const r of list) {
      try {
        await reg.showNotification(r.title, {
          body: r.body,
          tag: "gp-reengage-" + r.id,
          icon: "/icons/icon-192.png",
          showTrigger: new TimestampTrigger(r.at),
        });
      } catch {}
    }
    writeJson(PLAN_KEY, list.map(({ id, at }) => ({ id, at })));
  }

  async _scheduleNative() {
    if (!this._plugin) return;
    await this._cancelPending();
    const list = this.plan();
    if (!list.length) return;
    await this._plugin.schedule({
      notifications: list.map((r) => ({
        id: NATIVE_IDS[r.id],
        title: r.title,
        body: r.body,
        channelId: CHANNEL_ID,
        smallIcon: "ic_stat_gaepyo",
        isExactNotification: false, // true(기본)면 '알람 및 리마인더' 설정 화면을 띄운다
        schedule: { at: new Date(r.at), allowWhileIdle: true },
      })),
    });
    writeJson(PLAN_KEY, list.map(({ id, at }) => ({ id, at })));
  }

  // 돌아왔을 때: 이미 지난 예약은 '울렸다'로 기록(주 3회 상한), 남은 예약은 취소(게임 안에서 직접 보게 됨).
  async onResume(now = Date.now()) {
    if (this._plugin) { try { this._perm = mapPerm((await this._plugin.checkPermissions()).display); } catch {} } // 시스템 설정에서 바뀌었을 수 있다
    const plan = readJson(PLAN_KEY);
    if (plan.length) {
      const fired = plan.filter((p) => p.at <= now).map((p) => p.at);
      const sent = readJson(SENT_KEY).filter((t) => t > now - 7 * 24 * 3600000).concat(fired);
      writeJson(SENT_KEY, sent);
      writeJson(PLAN_KEY, []);
    }
    await this._cancelPending();
  }

  async _cancelPending() {
    if (this.native) {
      if (!this._plugin) return;
      try {
        const { notifications } = await this._plugin.getPending();
        if (notifications.length) await this._plugin.cancel({ notifications: notifications.map((n) => ({ id: n.id })) });
      } catch {}
      return;
    }
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const prev = await reg?.getNotifications({ includeTriggered: true });
      (prev || []).filter((n) => (n.tag || "").startsWith("gp-reengage")).forEach((n) => n.close());
    } catch {}
  }
}
