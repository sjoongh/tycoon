// 기기 설정 — 절전 모드(30fps), 화면 켜두기. 기기마다 다르므로 세이브가 아닌 localStorage 에 둔다.
const KEY = "gp-device";
const DEFAULTS = { saver: false, keepAwake: false };

let prefs = load();

function load() {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(KEY) || "null");
    return { saver: !!raw?.saver, keepAwake: !!raw?.keepAwake };
  } catch { return { ...DEFAULTS }; }
}

export function devicePrefs() { return { ...prefs }; }

export function setDevicePref(key, value) {
  if (!(key in DEFAULTS)) return;
  prefs = { ...prefs, [key]: !!value };
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* 저장 불가 무시 */ }
  applyDevicePrefs();
}

let game = null;
export function bindGame(g) { game = g; applyDevicePrefs(); }

export function applyDevicePrefs() {
  applyFps();
  applyKeepAwake();
}

// Phaser TimeStep 의 프레임 제한을 실행 중에 바꾼다(sleep→wake 가 step 함수를 다시 고른다)
function applyFps() {
  const loop = game?.loop;
  if (!loop) return;
  const limit = prefs.saver ? 30 : 0;
  if (loop.fpsLimit === limit) return;
  loop.fpsLimit = limit;
  loop.hasFpsLimit = limit > 0;
  loop._limitRate = limit > 0 ? 1000 / limit : 0;
  if (loop.running) { loop.sleep(); loop.wake(true); }
}

let wakeLock = null;
async function applyKeepAwake() {
  const on = prefs.keepAwake;
  // Android 앱: 창 플래그(ScreenAwakePlugin). WebView 는 Screen Wake Lock API 를 지원하지 않는다.
  if (globalThis.GaepyoScreenBridge?.setKeepOn) {
    try { globalThis.GaepyoScreenBridge.setKeepOn(on); } catch { /* 무시 */ }
    return;
  }
  if (!on) {
    try { await wakeLock?.release(); } catch { /* 무시 */ }
    wakeLock = null;
    return;
  }
  if (typeof navigator === "undefined" || !navigator.wakeLock || document.visibilityState !== "visible" || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch { wakeLock = null; }
}

// 브라우저는 화면을 벗어나면 잠금을 자동 해제하므로 돌아올 때 다시 요청한다
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && prefs.keepAwake) applyKeepAwake();
  });
}
