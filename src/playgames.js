// Google Play Games 연동 — 리더보드(도달 구역 랭킹) + 클라우드 세이브(스냅샷).
// 웹/미지원/미설정에서는 전부 안전하게 no-op. 실제 동작은 Play Console 설정 후 가능.
import { Capacitor } from "@capacitor/core";
import { PLAY_GAMES } from "./playGamesConfig.js";

let _pg = null;
let _signedIn = false;
let _gs = null;

function native() {
  return !!(Capacitor.isNativePlatform && Capacitor.isNativePlatform());
}
// 백엔드 플러그인 로더 — 현재 미연결(stub). Play Games/Firebase 등 백엔드를 정하면 여기서 로드.
// (Cap8 Play Games 플러그인 v0.1.1이 AGP9 요구로 현 템플릿과 충돌 → 백엔드 결정 후 연결 예정)
async function plugin() {
  return _pg; // null이면 모든 호출 no-op
}

// 앱 시작 시 1회 — 초기화 + 무음 로그인 + (성공 시) 클라우드 로드/점수 제출.
export async function initPlayGames(gameState) {
  _gs = gameState;
  if (!native()) return;
  try {
    const pg = await plugin();
    await pg.initialize();
    const res = await pg.signIn({ silent: true });
    _signedIn = !!(res && res.signedIn);
    if (_signedIn) {
      await maybeLoadCloud();
      submitArea();
    }
  } catch { /* 미설정/오프라인 — 무시 */ }
}

export function isSignedIn() { return _signedIn; }

// 도달 구역 = 랭킹 점수(최고 도달 구역). 사인인 + ID 있을 때만 제출.
export async function submitArea() {
  if (!_signedIn || !PLAY_GAMES.LEADERBOARD_AREA || !_gs) return;
  const best = Math.max(_gs.data.stage?.area || 1, _gs.data.prestige?.bestArea || 1);
  try { const pg = await plugin(); await pg.submitScore({ leaderboardId: PLAY_GAMES.LEADERBOARD_AREA, score: best }); } catch {}
}

// 랭킹 보기(네이티브 UI) — 버튼에서 호출. 미로그인 시 인터랙티브 로그인 시도.
export async function openLeaderboard() {
  if (!native()) return;
  try {
    const pg = await plugin();
    if (!_signedIn) { const r = await pg.signIn({ silent: false }); _signedIn = !!(r && r.signedIn); }
    if (!_signedIn) return;
    submitArea();
    if (PLAY_GAMES.LEADERBOARD_AREA) await pg.showLeaderboard({ leaderboardId: PLAY_GAMES.LEADERBOARD_AREA });
    else await pg.showAllLeaderboards();
  } catch {}
}

// ── 클라우드 세이브(스냅샷) — 기기 간 동기화 ──
async function maybeLoadCloud() {
  try {
    const pg = await plugin();
    const { snapshot } = await pg.loadSnapshot({ name: PLAY_GAMES.SNAPSHOT_NAME });
    if (!snapshot || !snapshot.data) return;
    const cloud = JSON.parse(snapshot.data);
    // 더 최신(lastSavedAt 큰) 쪽 채택 — 클라우드가 최신이면 적용
    if ((cloud.lastSavedAt || 0) > (_gs.data.lastSavedAt || 0)) {
      _gs.data = _gs.normalize(cloud, Date.now());
      _gs.emit("changed");
    }
  } catch {}
}

export async function saveCloud() {
  if (!_signedIn || !_gs) return;
  try {
    const pg = await plugin();
    await pg.saveSnapshot({
      name: PLAY_GAMES.SNAPSHOT_NAME,
      description: `구역 ${_gs.data.stage?.area || 1}`,
      data: JSON.stringify(_gs.data),
    });
  } catch {}
}
