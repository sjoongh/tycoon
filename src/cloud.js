// Firebase 클라우드 — 익명 로그인 + 클라우드 세이브(기기 간 동기화) + 랭킹(도달 구역).
// 설정(firebaseConfig)이 비어 있으면 전부 안전하게 no-op. Firebase는 동적 import로 코드 분리.
import { FIREBASE_CONFIG, cloudEnabled } from "./firebaseConfig.js";

const NICK_KEY = "gp-nick";
let _fb = null;       // { app, auth, db }
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

// 앱 시작 시 1회 — 익명 로그인 + (성공 시) 클라우드 세이브가 더 최신이면 적용.
export async function initCloud(gameState) {
  _gs = gameState;
  if (!cloudEnabled()) return;
  try {
    const { auth, signInAnonymously } = await fb();
    const cred = await signInAnonymously(auth);
    _uid = cred.user.uid;
    _ready = true;
    await maybeLoadCloud();
    submitScore();
  } catch (e) { /* 오프라인/설정오류 — 무시 */ }
}

export function cloudReady() { return _ready; }

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
    if ((cloud.lastSavedAt || 0) > (_gs.data.lastSavedAt || 0)) {
      _gs.data = _gs.normalize(cloud, Date.now());
      _gs.emit("changed");
    }
  } catch {}
}

export async function saveCloud() {
  if (!_ready || !_gs) return;
  try {
    const { db, fs } = await fb();
    await fs.setDoc(fs.doc(db, "saves", _uid), {
      json: JSON.stringify(_gs.data),
      lastSavedAt: _gs.data.lastSavedAt || Date.now(),
      area: _gs.data.stage?.area || 1,
    });
  } catch {}
}

// ── 랭킹(도달 구역) ──
function myScore() {
  const d = _gs.data;
  return { area: Math.max(d.stage?.area || 1, d.prestige?.bestArea || 1), votes: Math.floor(d.stats?.totalVotes || 0) };
}

export async function submitScore() {
  if (!_ready || !_gs) return;
  const nick = getNick();
  if (!nick) return; // 닉네임 없으면 랭킹 미등록(랭킹 열 때 입력받음)
  try {
    const { db, fs } = await fb();
    const s = myScore();
    await fs.setDoc(fs.doc(db, "scores", _uid), { nick, area: s.area, votes: s.votes, updatedAt: Date.now() });
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
export async function openLeaderboard() {
  if (!cloudEnabled()) return;
  // 닉네임 없으면 먼저 입력
  if (!getNick()) {
    const ok = await promptNickname();
    if (!ok) return;
    await submitScore();
  }
  renderLeaderboard("불러오는 중…", null);
  try {
    await submitScore(); // 최신 점수 반영 후 조회
    const rows = await fetchTop(50);
    renderLeaderboard(null, rows);
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
      <div class="gp-msub">랭킹에 표시될 이름을 정하세요(최대 12자)</div>
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

function renderLeaderboard(message, rows) {
  let ov = document.querySelector(".gp-rank-ov");
  if (!ov) {
    ov = document.createElement("div");
    ov.className = "gp-map-ov gp-rank-ov";
    ov.addEventListener("click", (e) => { if (e.target === ov || e.target.closest(".gp-map__x")) ov.remove(); });
    (document.querySelector(".gp-ui") || document.body).appendChild(ov);
  }
  let body;
  if (message) body = `<div class="gp-rank__msg">${message}</div>`;
  else {
    body = rows.map((r, i) => {
      const me = r.id === _uid ? " gp-rank__row--me" : "";
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
      return `<div class="gp-rank__row${me}"><span class="gp-rank__no">${medal}</span><span class="gp-rank__nick">${escapeHtml(r.nick || "익명")}</span><span class="gp-rank__area">${r.area}구역</span></div>`;
    }).join("") || `<div class="gp-rank__msg">아직 기록이 없어요. 1등 하세요!</div>`;
  }
  ov.innerHTML = `<div class="gp-map">
    <div class="gp-map__hd"><span>🏆 도달 구역 랭킹</span><button class="gp-map__x" aria-label="닫기">✕</button></div>
    <div class="gp-map__sub">내 닉네임: ${escapeHtml(getNick() || "(미설정)")} · 탭으로 변경</div>
    <div class="gp-map__list gp-rank__list">${body}</div>
    <div class="gp-map__foot">구역을 더 정복할수록 순위가 오릅니다</div>
  </div>`;
  // 닉네임 변경
  ov.querySelector(".gp-map__sub")?.addEventListener("click", async () => {
    const ok = await promptNickname();
    if (ok) { await submitScore(); openLeaderboard(); }
  });
}

function escapeHtml(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
