// 월간 시즌(레퍼런스 로드맵 장기 #1: IMT 월간 시즌 패스·Cats & Soup 월 단위 이벤트) — 무료 트랙만.
// 테마 6종이 달마다 순환한다(monthKey % 6). 모든 테마는 '가상 선거'로만 부르고 실제 선거·정당·인물을 쓰지 않는다.
// 한정 모자·시즌 발령은 해당 테마 달에만 트랙에서 얻는다. 6개월 뒤 같은 테마가 돌아오면 발령은 레벨업된다.

export const SEASON_THEMES = [
  { id: "night",   name: "밤샘 개표 가상 선거",   color: "#7fa8ff", hat: "cos-s-lamp",   title: "s-night" },
  { id: "ballot",  name: "투표함 대행진 가상 선거", color: "#7fd6c8", hat: "cos-s-boxhat", title: "s-ballot" },
  { id: "recount", name: "재검표 소동 가상 선거",  color: "#d9a46a", hat: "cos-s-deer",   title: "s-recount" },
  { id: "laurel",  name: "명예 개표 가상 선거",   color: "#b9d66f", hat: "cos-s-laurel", title: "s-laurel" },
  { id: "press",   name: "속보 경쟁 가상 선거",   color: "#c8ccd6", hat: "cos-s-press",  title: "s-press" },
  { id: "party",   name: "개표 축제 가상 선거",   color: "#ff9ad5", hat: "cos-s-party",  title: "s-party" },
];

// 포인트 적립처. 시즌 포인트는 보상 수령·달성 순간에만 쌓인다(같은 보상을 두 번 세지 않는다).
export const SEASON_POINTS = {
  daily: 10, // 일일 목표 1개 받기
  weekly: 60, // 주간 목표 받기
  chainEnding: 30, // 사건 체인 결말
  special: { bronze: 15, silver: 25, gold: 40, elite: 60 }, // 특별 개표소 등급 달성
};

// 무료 트랙 8단계. kind: reward(해명·인장) / hat(이 달 한정 모자) / title(이 달 시즌 발령).
export const SEASON_TRACK = [
  { need: 30, kind: "reward", reward: { explain: 80 } },
  { need: 80, kind: "reward", reward: { seals: 1 } },
  { need: 150, kind: "reward", reward: { explain: 150 } },
  { need: 240, kind: "hat" },
  { need: 350, kind: "reward", reward: { seals: 2 } },
  { need: 480, kind: "reward", reward: { explain: 300 } },
  { need: 640, kind: "reward", reward: { seals: 3 } },
  { need: 820, kind: "title" },
];

export const SEASON_HISTORY_MAX = 6;

// 로컬 달력 기준 월 키(연×12+월). 0이면 시즌 기록 없음.
export function seasonKeyFor(ms) {
  const d = new Date(ms);
  return d.getFullYear() * 12 + d.getMonth();
}

export function seasonMonthOf(key) {
  return (((key % 12) + 12) % 12) + 1;
}

export function seasonThemeFor(key) {
  const n = SEASON_THEMES.length;
  return SEASON_THEMES[((key % n) + n) % n];
}

// 이번 달 마지막 날까지 남은 일수(오늘 포함, 최소 1).
export function seasonDaysLeft(ms) {
  const d = new Date(ms);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Math.max(1, last - d.getDate() + 1);
}

// points 로 새로 도달한 단계 인덱스(이미 받은 단계 수 = reached 이후부터).
export function seasonStepsReached(points) {
  let n = 0;
  for (const s of SEASON_TRACK) { if (points >= s.need) n += 1; else break; }
  return n;
}

export function seasonStepReward(step, theme) {
  const s = SEASON_TRACK[step];
  if (!s) return null;
  if (s.kind === "hat") return { kind: "hat", id: theme.hat };
  if (s.kind === "title") return { kind: "title", id: theme.title };
  return { kind: "reward", reward: s.reward };
}

export function normalizeSeason(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const int = (v) => Math.max(0, Math.floor(Number(v) || 0));
  const history = Array.isArray(s.history)
    ? s.history.filter((h) => h && typeof h === "object").map((h) => ({ key: int(h.key), theme: String(h.theme || ""), points: int(h.points), steps: Math.min(SEASON_TRACK.length, int(h.steps)) })).slice(-SEASON_HISTORY_MAX)
    : [];
  return { key: int(s.key), points: int(s.points), steps: Math.min(SEASON_TRACK.length, int(s.steps)), history };
}

// 달이 바뀌면 지난 시즌을 기록에 남기고 새 시즌을 0에서 시작한다. 반환: { season, archived|null }.
export function rolloverSeason(season, key) {
  const s = normalizeSeason(season);
  if (s.key === key) return { season: s, archived: null };
  const archived = s.key > 0 && (s.points > 0 || s.steps > 0)
    ? { key: s.key, theme: seasonThemeFor(s.key).id, points: s.points, steps: s.steps }
    : null;
  const history = archived ? [...s.history, archived].slice(-SEASON_HISTORY_MAX) : s.history;
  return { season: { key, points: 0, steps: 0, history }, archived };
}
