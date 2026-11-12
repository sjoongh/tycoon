// 재방문 알림 계획(로드맵 #9) — '받을 것이 있다'형 3종, 조용한 시간, 겹침 정리, 주 3회 상한.
import { describe, it, expect } from "vitest";
import { planReminders, reminderSnapshot, WEEKLY_NOTIF_CAP } from "../src/state/reminders.js";
import { GameState } from "../src/state/GameState.js";

const HOUR = 3600000;
const local = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const base = (patch = {}) => ({
  capMs: 8 * HOUR, today: 100, dailyDay: 100, streak: 1, weekDaysLeft: 4,
  weeklyClaimable: false, weeklyClaimed: false, weeklyRatio: 0,
  special: { open: false, daysLeft: 0, joined: false, nextTier: null },
  ...patch,
});
const ids = (list) => list.map((r) => r.id);

describe("planReminders", () => {
  it("투표함 가득 참은 지금 + 오프라인 한도에 울린다", () => {
    const now = local(2026, 11, 12, 10);
    const [cap] = planReminders(base(), now);
    expect(cap.id).toBe("cap");
    expect(cap.at).toBe(now + 8 * HOUR);
    expect(cap.title).toBe("투표함이 가득 찼습니다");
  });

  it("한도 도달이 23시~8시면 아침 8시로 미룬다", () => {
    const night = local(2026, 11, 12, 20); // +8h = 04:00
    expect(planReminders(base(), night)[0].at).toBe(local(2026, 11, 13, 8));
    const late = local(2026, 11, 12, 16); // +8h = 00:00
    expect(planReminders(base(), late)[0].at).toBe(local(2026, 11, 13, 8));
    const eve = local(2026, 11, 12, 15); // +8h = 23:00
    expect(planReminders(base(), eve)[0].at).toBe(local(2026, 11, 13, 8));
  });

  it("출석 연속은 2일 이상일 때만, 끊기기 2시간 전(22시)에 울린다", () => {
    const now = local(2026, 11, 12, 9);
    expect(ids(planReminders(base({ streak: 1 }), now))).not.toContain("streak");
    // 오늘 이미 받음 → 내일 밤 자정에 끊김 → 내일 22시
    const claimedToday = planReminders(base({ streak: 4, dailyDay: 100 }), now).find((r) => r.id === "streak");
    expect(claimedToday.at).toBe(local(2026, 11, 13, 22));
    expect(claimedToday.title).toBe("출석 4일 연속이 곧 끊겨요");
    // 어제 받음(오늘 아직) → 오늘 밤 끊김 → 오늘 22시
    const claimedYesterday = planReminders(base({ streak: 4, dailyDay: 99 }), now).find((r) => r.id === "streak");
    expect(claimedYesterday.at).toBe(local(2026, 11, 12, 22));
    // 이미 끊김 → 없음
    expect(ids(planReminders(base({ streak: 4, dailyDay: 97 }), now))).not.toContain("streak");
  });

  it("주간 마감: 보상 대기 또는 절반 이상 진행일 때만 마감일 정오", () => {
    const now = local(2026, 11, 12, 9);
    expect(ids(planReminders(base({ weeklyRatio: 0.3 }), now))).not.toContain("week");
    const claimable = planReminders(base({ weeklyClaimable: true, weeklyRatio: 1.2 }), now).find((r) => r.id === "week");
    expect(claimable.at).toBe(local(2026, 11, 15, 12)); // 4일 남음 → 마지막 날 = 오늘+3
    expect(claimable.title).toBe("주간 과제 보상이 남아 있어요");
    const near = planReminders(base({ weeklyRatio: 0.72 }), now).find((r) => r.id === "week");
    expect(near.body).toContain("72%");
    expect(ids(planReminders(base({ weeklyClaimed: true, weeklyRatio: 2 }), now))).not.toContain("week");
  });

  it("특별 개표소: 참여했고 남은 등급이 있을 때 닫히는 날 정오", () => {
    const now = local(2026, 11, 12, 9);
    const sp = { open: true, daysLeft: 2, joined: true, nextTier: "실버" };
    const r = planReminders(base({ special: sp }), now).find((x) => x.id === "special");
    expect(r.at).toBe(local(2026, 11, 13, 12));
    expect(r.body).toContain("실버");
    expect(ids(planReminders(base({ special: { ...sp, joined: false } }), now))).not.toContain("special");
    expect(ids(planReminders(base({ special: { ...sp, nextTier: null } }), now))).not.toContain("special");
  });

  it("3시간 안에 겹치면 우선순위 높은 것만 남긴다", () => {
    // 14시 + 8h = 22시 → 출석(22시)과 투표함이 겹친다 → 출석 우선
    const now = local(2026, 11, 12, 14);
    const list = planReminders(base({ streak: 3, dailyDay: 99 }), now);
    expect(ids(list)).toEqual(["streak"]);
  });

  it("주 3회 상한: 최근 7일 발송 수만큼 줄이고, 우선순위 순으로 남긴다", () => {
    const now = local(2026, 11, 12, 9);
    const s = base({ streak: 3, dailyDay: 99, weeklyClaimable: true, special: { open: true, daysLeft: 1, joined: true, nextTier: "골드" } });
    // 후보: cap 17시, streak 오늘 22시, week 15일 12시, special 오늘 12시
    const all = planReminders(s, now);
    expect(all.length).toBe(WEEKLY_NOTIF_CAP);
    expect(ids(all)).toEqual(["cap", "streak", "week"]); // 특별(최저 우선) 탈락, 시간순 정렬
    const two = planReminders(s, now, [now - 2 * 24 * HOUR, now - 8 * 24 * HOUR]); // 7일 넘은 건 안 셈
    expect(ids(two)).toEqual(["streak", "week"]);
    expect(planReminders(s, now, [now - HOUR, now - 2 * HOUR, now - 3 * HOUR])).toEqual([]);
  });

  it("이미 지난 시각은 예약하지 않는다", () => {
    const now = local(2026, 11, 12, 22, 30); // 오늘 22시 출석 알림은 지났다
    expect(ids(planReminders(base({ streak: 3, dailyDay: 99 }), now))).not.toContain("streak");
  });
});

describe("reminderSnapshot", () => {
  it("실제 GameState 에서 계획을 만든다(오류 없이 투표함 알림 포함)", () => {
    const store = new Map();
    globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
    const gs = new GameState();
    const snap = reminderSnapshot(gs);
    expect(snap.capMs).toBe(8 * HOUR);
    expect(ids(planReminders(snap, Date.now()))).toContain("cap");
  });
});
