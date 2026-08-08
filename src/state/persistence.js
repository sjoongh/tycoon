// 네이티브(Capacitor) 세이브 미러 — WebView localStorage는 프로세스 킬 직후 flush 유실이나
// OS 스토리지 정리로 날아갈 수 있어, 안드로이드에서는 같은 세이브 JSON을 SharedPreferences
// (@capacitor/preferences)에 이중 기록한다. 웹에서는 전부 no-op.
import { Capacitor } from "@capacitor/core";
import { SAVE_KEY } from "../config.js";

function isNative() {
  try { return !!Capacitor.isNativePlatform?.(); } catch { return false; }
}

let _prefs = null;
async function prefs() {
  if (!_prefs) _prefs = (await import("@capacitor/preferences")).Preferences;
  return _prefs;
}

// 연타 구매 등으로 저장이 몰려도 네이티브 브릿지 호출은 직렬화하고 마지막 값만 쓴다.
let _pending = null;
let _writing = false;
export function mirrorNativeSave(json) {
  if (!isNative()) return;
  _pending = json;
  if (_writing) return;
  _writing = true;
  (async () => {
    try {
      const P = await prefs();
      while (_pending !== null) {
        const value = _pending;
        _pending = null;
        await P.set({ key: SAVE_KEY, value });
      }
    } catch {}
    _writing = false;
  })();
}

export function clearNativeSave() {
  if (!isNative()) return;
  _pending = null;
  prefs().then((P) => P.remove({ key: SAVE_KEY })).catch(() => {});
}

// 부팅 시 1회 — 미러가 localStorage보다 최신이면(=마지막 localStorage 쓰기가 유실된 경우)
// 클라우드 세이브와 동일한 단일 경로(adoptCloudData)로 채택한다.
export async function restoreNativeSave(gameState) {
  if (!isNative()) return false;
  try {
    const P = await prefs();
    const { value } = await P.get({ key: SAVE_KEY });
    if (!value) return false;
    const parsed = JSON.parse(value);
    if ((parsed?.lastSavedAt || 0) > (gameState.data.lastSavedAt || 0)) {
      gameState.adoptCloudData(parsed, Date.now());
      return true;
    }
  } catch {}
  return false;
}
