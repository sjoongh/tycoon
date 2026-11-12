// 재방문 알림 계획 — '받을 것이 있다'형 3종만, 주 3회 상한(레퍼런스 로드맵 #9).
// 순수 함수: GameState 스냅샷 + 현재 시각 + 최근 발송 기록 → 예약할 알림 목록.
const HOUR = 3600000;
export const WEEKLY_NOTIF_CAP = 3;
const MIN_GAP_MS = 3 * HOUR; // 연달아 울리지 않게 — 3시간 안에 겹치면 우선순위 높은 것만
const QUIET_START_H = 23; // 23시~8시에는 보내지 않는다(투표함 알림은 아침 8시로 미룸)
const QUIET_END_H = 8;

// now 기준 로컬 자정 + offsetDays (DST·시간대 안전하게 Date 로 계산)
export function dayStart(now, offsetDays = 0) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.getTime();
}

function atHour(now, offsetDays, hour) {
  const d = new Date(dayStart(now, offsetDays));
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function outOfQuiet(at) {
  const d = new Date(at);
  const h = d.getHours();
  if (h >= QUIET_START_H) { d.setDate(d.getDate() + 1); d.setHours(QUIET_END_H, 0, 0, 0); }
  else if (h < QUIET_END_H) d.setHours(QUIET_END_H, 0, 0, 0);
  return d.getTime();
}

// GameState → 계획에 필요한 값만. (테스트는 이 모양의 객체를 직접 만든다)
export function reminderSnapshot(gs) {
  const d = gs.data;
  const today = gs._todayIndex();
  const sch = gs.specialSchedule();
  const sp = d.special || {};
  const next = (gs.specialTiers() || []).find((t) => !sp.tiers?.[t.id]);
  const target = gs.weeklyTarget();
  return {
    capMs: gs.offlineCapMsFor(d),
    today,
    dailyDay: d.daily?.day || 0,
    streak: d.daily?.streak || 0,
    weekDaysLeft: gs.weeklyDaysLeft(),
    weeklyClaimable: gs.weeklyClaimable(),
    weeklyClaimed: gs.weeklyClaimed(),
    weeklyRatio: target > 0 ? gs.weeklyProgress() / target : 0,
    special: {
      open: !!sch.open,
      daysLeft: sch.daysLeft || 0,
      joined: sp.week === sch.week && (sp.total || 0) > 0,
      nextTier: next ? next.name : null,
    },
  };
}

export function planReminders(s, now, sentTimes = []) {
  const cands = [];

  // 1) 투표함 가득 참 — 오프라인 정산 한도 도달
  cands.push({ id: "cap", pri: 2, at: outOfQuiet(now + s.capMs), title: "투표함이 가득 찼습니다", body: "오프라인 정산이 한도에 도달했어요. 들러서 수령하세요." });

  // 2) 출석 연속 만료 2시간 전(22시). 오늘 받았으면 내일 밤, 어제 받았으면 오늘 밤에 끊긴다.
  if (s.streak >= 2 && (s.dailyDay === s.today || s.dailyDay === s.today - 1)) {
    const lastDay = s.dailyDay === s.today ? 1 : 0;
    cands.push({ id: "streak", pri: 3, at: atHour(now, lastDay, 22), title: `출석 ${s.streak}일 연속이 곧 끊겨요`, body: "2시간 뒤 연속 기록이 초기화돼요. 오늘 출석 보상을 받아두세요." });
  }

  // 3) 주간·이벤트 마감일 정오 — 받을 보상이 남아 있을 때만
  const weekLast = s.weekDaysLeft - 1;
  if (s.weeklyClaimable) {
    cands.push({ id: "week", pri: 4, at: atHour(now, weekLast, 12), title: "주간 과제 보상이 남아 있어요", body: "오늘 자정에 주간이 마감돼요. 인장 보상을 받아두세요." });
  } else if (!s.weeklyClaimed && s.weeklyRatio >= 0.5) {
    cands.push({ id: "week", pri: 1, at: atHour(now, weekLast, 12), title: "주간 과제가 오늘 마감돼요", body: `목표의 ${Math.floor(Math.min(s.weeklyRatio, 0.99) * 100)}%까지 왔어요. 자정 전에 채우면 인장을 받아요.` });
  }
  if (s.special.open && s.special.joined && s.special.nextTier && s.special.daysLeft > 0) {
    cands.push({ id: "special", pri: 1, at: atHour(now, s.special.daysLeft - 1, 12), title: "특별 개표소가 오늘 자정에 닫혀요", body: `${s.special.nextTier} 등급 보상까지 남은 표를 채워보세요.` });
  }

  // 겹침 정리: 우선순위 높은 것부터 자리를 잡고, 3시간 안에 겹치는 후보는 버린다
  const picked = [];
  for (const c of cands.filter((c) => c.at > now + 60000).sort((a, b) => b.pri - a.pri || a.at - b.at)) {
    if (picked.some((p) => Math.abs(p.at - c.at) < MIN_GAP_MS)) continue;
    picked.push(c);
  }
  // 주 3회 상한(최근 7일 발송 수 차감) — 우선순위 순으로 자르고 시간순으로 돌려준다
  const recent = sentTimes.filter((t) => t > now - 7 * 24 * HOUR).length;
  const room = Math.max(0, WEEKLY_NOTIF_CAP - recent);
  return picked
    .slice(0, room)
    .sort((a, b) => a.at - b.at)
    .map(({ id, at, title, body }) => ({ id, at, title, body }));
}
