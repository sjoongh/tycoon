// Firebase 클라우드 — 익명 로그인 + 클라우드 세이브(기기 간 동기화) + 랭킹(도달 구역).
// 설정(firebaseConfig)이 비어 있으면 전부 안전하게 no-op. Firebase는 동적 import로 코드 분리.
import { FIREBASE_CONFIG, cloudEnabled } from "./firebaseConfig.js";
import { iconHtml } from "./ui/icon.js";
import { clock, offsetFromRoundTrip, CLOCK_OFFSET_MIN_SHIFT_MS } from "./state/clock.js";
import { NATIONAL_EVENTS_CAP } from "./data/nationalGoal.js";

const NICK_KEY = "gp-nick";
let _fb = null;       // { app, auth, db }
let _analyticsPromise = null;
let _uid = null;
let _gs = null;
let _ready = false;

function getNick() {
  let n = "";
  try { n = localStorage.getItem(NICK_KEY) || ""; } catch {}
  return n;
}
function setNick(n) {
  n = (n || "").trim().slice(0, 12);
  try { localStorage.setItem(NICK_KEY, n); } catch {}
  return n;
}

async function fb() {
  if (_fb) return _fb;
  const [{ initializeApp }, { getAuth, signInAnonymously }, fs] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db = fs.getFirestore(app);
  _fb = { app, auth, db, fs, signInAnonymously };
  return _fb;
}
let _fb_logEvent = null;

async function analyticsClient() {
  if (_analyticsPromise) return _analyticsPromise;
  _analyticsPromise = (async () => {
    try {
      const [{ app }, analytics] = await Promise.all([fb(), import("firebase/analytics")]);
      if (!(await analytics.isSupported())) return null;
      _fb_logEvent = analytics.logEvent;
      return analytics.getAnalytics(app);
    } catch {
      return null;
    }
  })();
  return _analyticsPromise;
}

// 게임 이벤트 분석 로깅 — 설정/지원 안 되면 no-op.
export async function logEvt(name, params) {
  if (!cloudEnabled()) return;
  try {
    const analytics = await analyticsClient();
    if (analytics && _fb_logEvent) _fb_logEvent(analytics, name, params || {});
  } catch {}
}

// 앱 시작 시 1회 — 익명 로그인 + (성공 시) 클라우드 세이브가 더 최신이면 적용.
export async function initCloud(gameState) {
  _gs = gameState;
  if (!cloudEnabled()) return;
  try {
    const { auth, signInAnonymously } = await fb();
    const cred = await signInAnonymously(auth);
    _uid = cred.user.uid;
    _ready = true;
    await calibrateClock();
    await maybeLoadCloud();
    submitScore();
  } catch (e) { /* 오프라인/설정오류 — 무시 */ }
}

export function cloudReady() { return _ready; }

// ── 서버 시계 보정 — serverTimestamp 왕복 1회로 로컬 시계 오프셋을 잡는다(실패해도 무시) ──
async function calibrateClock() {
  try {
    const { db, fs } = await fb();
    const ref = fs.doc(db, "clock", _uid);
    const sentAt = Date.now();
    await fs.setDoc(ref, { t: fs.serverTimestamp() });
    const snap = await fs.getDoc(ref);
    const receivedAt = Date.now();
    const serverMs = snap.data()?.t?.toMillis?.();
    if (typeof serverMs === "number" && Number.isFinite(serverMs)) {
      const next = offsetFromRoundTrip(serverMs, sentAt, receivedAt);
      if (Math.abs(next - clock.offset) < CLOCK_OFFSET_MIN_SHIFT_MS) { clock.measuredAt = Date.now(); return; }
      const shift = clock.setOffset(next);
      clock.persist();
      _gs?.rebaseClock(shift);
    }
  } catch {}
}

// ── 클라우드 세이브 ──
async function maybeLoadCloud() {
  if (!_ready || !_gs) return;
  try {
    const { db, fs } = await fb();
    const snap = await fs.getDoc(fs.doc(db, "saves", _uid));
    if (!snap.exists()) return;
    const json = snap.data()?.json;
    if (!json) return;
    const cloud = JSON.parse(json);
    if (_gs.shouldAdopt(cloud)) {
      // 클라우드 채택은 GameState 단일 경로로 — 오프라인 보상 재계산 + 즉시 로컬 저장(중복/경합 방지)
      _gs.adoptCloudData(cloud, clock.now());
    }
  } catch {}
}

export async function saveCloud() {
  if (!_ready || !_gs) return;
  try {
    const { db, fs } = await fb();
    await fs.setDoc(fs.doc(db, "saves", _uid), {
      json: JSON.stringify(_gs.data),
      lastSavedAt: _gs.data.lastSavedAt || clock.now(),
      area: _gs.data.stage?.area || 1,
    });
  } catch {}
}

// ── 랭킹(도달 구역) ──
function myScore() {
  const d = _gs.data;
  return {
    area: Math.max(d.stage?.area || 1, d.prestige?.bestArea || 1),
    votes: Math.floor(d.stats?.totalVotes || 0),
    week: _gs._weekIndex ? _gs._weekIndex() : 0,
    weekVotes: Math.floor(_gs.weeklyProgress ? _gs.weeklyProgress() : 0),
    weekEvents: Math.min(NATIONAL_EVENTS_CAP, Math.floor(_gs.weeklyEvents ? _gs.weeklyEvents() : 0)),
  };
}

export async function submitScore() {
  if (!_ready || !_gs) return;
  const nick = getNick();
  if (!nick) return; // 닉네임 없으면 랭킹 미등록(랭킹 열 때 입력받음)
  try {
    const { db, fs } = await fb();
    const s = myScore();
    await fs.setDoc(fs.doc(db, "scores", _uid), { nick, area: s.area, votes: s.votes, week: s.week, weekVotes: s.weekVotes, weekEvents: s.weekEvents, updatedAt: Date.now() });
  } catch {}
}

// 이번 주 랭킹: 최근 갱신 순 100명을 받아 이번 주(week) 기록만 주간 처리 표(weekVotes)로 정렬. 단일 필드 정렬이라 복합 색인 불필요.
async function fetchWeekly(n = 100) {
  const { db, fs } = await fb();
  const wk = _gs?._weekIndex ? _gs._weekIndex() : 0;
  const q = fs.query(fs.collection(db, "scores"), fs.orderBy("updatedAt", "desc"), fs.limit(n));
  const res = await fs.getDocs(q);
  const rows = [];
  res.forEach((doc) => { const d = doc.data(); if (d.week === wk) rows.push({ id: doc.id, ...d }); });
  rows.sort((a, b) => ((b.weekVotes || 0) - (a.weekVotes || 0)) || ((b.area || 0) - (a.area || 0)));
  return rows;
}

function recordMyRank(rows) {
  const i = rows.findIndex((r) => r.id === _uid);
  if (i >= 0 && _gs?.recordWeeklyRank) { _gs.recordWeeklyRank(i + 1, rows.length); _gs.save?.(false); }
  return i + 1;
}

// 세션 시작 시 조용히 1회: 점수 올리고 이번 주 내 순위를 기록(주가 바뀌면 뱃지 확정 근거)
export async function refreshWeeklyRank() {
  if (!_ready || !_gs || !getNick()) return null;
  try {
    await submitScore();
    const rows = await fetchWeekly(100);
    return recordMyRank(rows);
  } catch { return null; }
}

// 전국 합산: 그 주 점수 문서의 weekEvents 합. 서버 집계(복합 색인 week+weekEvents, 색인에 없는 문서는 빠짐)를 쓰고,
// 집계가 실패하거나 1인 상한을 넘는 기록이 섞였으면 문서를 받아 1인 상한으로 잘라 다시 더한다.
async function fetchNational(wk) {
  const { db, fs } = await fb();
  const q = fs.query(fs.collection(db, "scores"), fs.where("week", "==", wk));
  try {
    const snap = await fs.getAggregateFromServer(q, { events: fs.sum("weekEvents"), players: fs.count() });
    const { events = 0, players = 0 } = snap.data();
    if (events <= players * NATIONAL_EVENTS_CAP) return { events, players };
  } catch {}
  const res = await fs.getDocs(q);
  let events = 0;
  let players = 0; // 서버 집계(색인)와 같게 weekEvents가 있는 문서만 센다 — 이전 버전 앱 기록은 빠진다
  res.forEach((doc) => {
    const v = doc.data().weekEvents;
    if (typeof v !== "number") return;
    players += 1;
    events += Math.min(NATIONAL_EVENTS_CAP, Math.max(0, Math.floor(v)));
  });
  return { events, players };
}

// 이번 주 합산 반영 + 지난주 정산 대기분이 있으면 그 주 합산으로 정산. 닉네임이 없어도 조회·보상은 된다(합산 기여만 없음).
export async function refreshNational() {
  if (!_ready || !_gs?.nationalState) return;
  try {
    const pending = _gs.nationalPendingWeek();
    if (pending) { const p = await fetchNational(pending); _gs.setNationalTotal(pending, p.events, p.players); }
    const wk = _gs.nationalState().week;
    const t = await fetchNational(wk);
    _gs.setNationalTotal(wk, t.events, t.players);
  } catch {}
}

async function fetchTop(n = 50) {
  const { db, fs } = await fb();
  // 단일 정렬(area)만 서버에서 — 복합 색인 불필요. 동점 표(votes) 정렬은 클라이언트에서.
  const q = fs.query(fs.collection(db, "scores"), fs.orderBy("area", "desc"), fs.limit(n));
  const res = await fs.getDocs(q);
  const rows = [];
  res.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
  rows.sort((a, b) => (b.area - a.area) || ((b.votes || 0) - (a.votes || 0)));
  return rows;
}

// ── 랭킹 모달 UI ──
export async function openLeaderboard(readyPromise = null) {
  if (!cloudEnabled()) return;
  if (readyPromise) {
    renderLeaderboard("클라우드 연결 중…", null);
    await readyPromise;
    if (!_ready) {
      renderLeaderboard("클라우드에 연결하지 못했어요. 네트워크를 확인해 주세요.", null);
      return;
    }
  }
  // 닉네임 없으면 먼저 입력
  if (!getNick()) {
    const ok = await promptNickname();
    if (!ok) return;
    await submitScore();
  }
  renderLeaderboard("불러오는 중…", null);
  try {
    await submitScore(); // 최신 점수 반영 후 조회
    const [rows, weekly] = await Promise.all([fetchTop(50), fetchWeekly(100), refreshNational()]);
    recordMyRank(weekly);
    renderLeaderboard(null, rows, weekly);
  } catch (e) {
    renderLeaderboard("랭킹을 불러오지 못했어요(네트워크 확인)", null);
  }
}

function promptNickname() {
  return new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.className = "gp-map-ov";
    ov.innerHTML = `<div class="gp-modal" style="text-align:center">
      <div class="gp-mtitle">랭킹 닉네임</div>
      <div class="gp-msub">최대 12자</div>
      <input class="gp-nickinput" maxlength="12" placeholder="예: 정직한개표원" />
      <div class="gp-confirm-row" style="margin-top:10px">
        <button class="gp-btn gp-btn--disabled" data-cancel>취소</button>
        <button class="gp-btn gp-btn--gold" data-ok>확인</button>
      </div></div>`;
    const input = ov.querySelector(".gp-nickinput");
    const done = (val) => { ov.remove(); resolve(val); };
    ov.addEventListener("click", (e) => {
      if (e.target.closest("[data-ok]")) { const n = setNick(input.value); if (n) done(true); else input.focus(); }
      else if (e.target.closest("[data-cancel]") || e.target === ov) done(false);
    });
    document.querySelector(".gp-ui")?.appendChild(ov) || document.body.appendChild(ov);
    setTimeout(() => input.focus(), 50);
  });
}

function nationalHtml() {
  const st = _gs?.nationalState ? _gs.nationalState() : null;
  if (!st) return "";
  if (!st.known) return `<div class="gp-nat"><div class="gp-nat__hd"><span>전국 합산 사건 대응</span><b>-</b></div><div class="gp-nat__me">합산을 불러오지 못했어요</div></div>`;
  const next = st.tiers[st.reached];
  const pct = next ? Math.max(0, Math.min(100, (st.total / next.need) * 100)) : 100;
  const tiers = st.tiers.map((t, i) => {
    const cls = i < st.claimed ? " gp-nat__tier--got" : i < st.reached ? " gp-nat__tier--done" : "";
    return `<span class="gp-nat__tier${cls}"><b>${fmtNum(t.need)}</b><small>${t.reward.explain ? `해명 +${t.reward.explain}` : ""}${t.reward.seals ? `<br>인장 +${t.reward.seals}` : ""}</small></span>`;
  }).join("");
  const me = st.eligible ? `내 사건 ${st.mine}건` : `내 사건 ${st.mine}/${st.min}건 · ${st.min}건부터 보상`;
  return `<div class="gp-nat">
    <div class="gp-nat__hd"><span>전국 합산 사건 대응</span><b>${fmtNum(st.total)}${next ? ` / ${fmtNum(next.need)}` : ""}</b></div>
    <div class="gp-nat__bar"><i style="width:${pct.toFixed(1)}%"></i></div>
    <div class="gp-nat__tiers">${tiers}</div>
    <div class="gp-nat__me"><span>참여 ${st.players}명 · ${me}</span>${st.claimable ? `<button class="gp-btn gp-btn--gold gp-nat__claim" data-nat-claim>받기</button>` : ""}</div>
  </div>`;
}

const TIER_LABEL = { elite: "엘리트", gold: "골드", silver: "실버", bronze: "브론즈" };

function renderLeaderboard(message, rows, weekly = null) {
  let ov = document.querySelector(".gp-rank-ov");
  if (!ov) {
    ov = document.createElement("div");
    ov.className = "gp-map-ov gp-rank-ov";
    ov.addEventListener("click", (e) => { if (e.target === ov || e.target.closest(".gp-map__x")) ov.remove(); });
    (document.querySelector(".gp-ui") || document.body).appendChild(ov);
  }
  const mode = ov.dataset.mode || "weekly";
  let body;
  const rowHtml = (r, i, valueHtml) => `<div class="gp-rank__row${r.id === _uid ? " gp-rank__row--me" : ""}"><span class="gp-rank__no">${i + 1}</span><span class="gp-rank__nick">${escapeHtml(r.nick || "익명")}</span><span class="gp-rank__area">${valueHtml}</span></div>`;
  if (message) body = `<div class="gp-rank__msg">${message}</div>`;
  else if (mode === "weekly") {
    body = (weekly || []).map((r, i) => rowHtml(r, i, `${fmtNum(r.weekVotes || 0)}표`)).join("") || `<div class="gp-rank__msg">이번 주 기록 없음</div>`;
  } else {
    body = rows.map((r, i) => rowHtml(r, i, `${r.area}구역`)).join("") || `<div class="gp-rank__msg">기록 없음</div>`;
  }
  const myRank = weekly ? weekly.findIndex((r) => r.id === _uid) + 1 : 0;
  const daysLeft = _gs?.weeklyDaysLeft ? _gs.weeklyDaysLeft() : (_gs?.weeklyRemainingDays ? _gs.weeklyRemainingDays() : null);
  const tierNow = myRank > 0 && _gs?.constructor?.badgeTierFor ? _gs.constructor.badgeTierFor(myRank, weekly.length) : null;
  const badges = (_gs?.latestBadges ? _gs.latestBadges(4) : []).map((b) => `<span class="gp-badge gp-badge--${b.tier}" title="${b.week}주차 ${b.rank}위">${TIER_LABEL[b.tier]}</span>`).join("");
  ov.innerHTML = `<div class="gp-map">
    <div class="gp-map__hd"><span>${iconHtml("ui-trophy", { size: 32 })}랭킹</span><button class="gp-map__x" aria-label="닫기">✕</button></div>
    <div class="gp-rank__tabs"><button class="gp-rank__tab${mode === "weekly" ? " gp-rank__tab--on" : ""}" data-mode="weekly">이번 주 개표${daysLeft != null ? ` · ${daysLeft}일 남음` : ""}</button><button class="gp-rank__tab${mode === "all" ? " gp-rank__tab--on" : ""}" data-mode="all">도달 구역</button></div>
    <div class="gp-map__sub">내 닉네임: ${escapeHtml(getNick() || "(미설정)")} · 탭으로 변경${myRank > 0 && mode === "weekly" ? ` · 현재 ${myRank}위${tierNow ? ` → ${TIER_LABEL[tierNow]} 예정` : ""}` : ""}</div>
    ${badges ? `<div class="gp-rank__badges">${badges}</div>` : ""}
    ${mode === "weekly" && !message ? nationalHtml() : ""}
    <div class="gp-map__list gp-rank__list">${body}</div>
    ${mode === "weekly" ? `<div class="gp-map__foot">주가 끝나면 순위에 따라 브론즈~엘리트 뱃지와 해명·인장을 받습니다. 뱃지는 개표소 벽에 걸립니다.</div>` : ""}
  </div>`;
  ov.querySelector("[data-nat-claim]")?.addEventListener("click", () => { _gs.claimNational(); renderLeaderboard(null, rows, weekly); });
  ov.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { ov.dataset.mode = b.dataset.mode; renderLeaderboard(null, rows, weekly); }));
  // 닉네임 변경
  ov.querySelector(".gp-map__sub")?.addEventListener("click", async () => {
    const ok = await promptNickname();
    if (ok) { await submitScore(); openLeaderboard(); }
  });
}

function fmtNum(v) {
  if (v >= 1e8) return `${(v / 1e8).toFixed(v >= 1e9 ? 0 : 1)}억`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(v >= 1e5 ? 0 : 1)}만`;
  return String(Math.floor(v));
}

function escapeHtml(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// 개발 서버 QA용(배포 빌드에서는 제거): 네트워크 없이 랭킹 화면을 그려 본다
if (import.meta.env.DEV) window.__gpCloud = { renderLeaderboard, setGameState: (gs) => { _gs = gs; } };
