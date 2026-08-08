// 네이티브(Capacitor) 세이브 미러 — WebView localStorage는 프로세스 킬 직후 flush 유실이나
// OS 스토리지 정리로 날아갈 수 있다. Android 동기 브리지가 SharedPreferences.commit() 완료까지
// 기다린 뒤 반환하고, 기존 Capacitor Preferences는 구버전 복구/fallback으로만 사용한다.
import { Capacitor } from "@capacitor/core";
import { SAVE_KEY } from "../config.js";

const BRIDGE_NAME = "GaepyoSaveBridge";

function isNative() {
  try { return !!Capacitor.isNativePlatform?.(); } catch { return false; }
}

let _prefs = null;
async function prefs() {
  if (!_prefs) _prefs = (await import("@capacitor/preferences")).Preferences;
  return _prefs;
}

function durableBridge() {
  try { return globalThis[BRIDGE_NAME] || null; } catch { return null; }
}

function parseSave(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readDurableSave() {
  try {
    const value = durableBridge()?.read?.();
    return typeof value === "string" && parseSave(value) ? value : null;
  } catch {
    return null;
  }
}

// GameState가 localStorage를 읽기 전에 실행한다. 동기 슬롯이 더 최신하거나 같은 시각의
// 마지막 값일 때만 복구해, 정상적으로 flush된 최신 localStorage를 오래된 미러가 되돌리지 않게 한다.
export function seedLocalStorageFromDurableSave() {
  const durableValue = readDurableSave();
  if (!durableValue) return false;
  try {
    const durable = parseSave(durableValue);
    const localValue = localStorage.getItem(SAVE_KEY);
    const local = parseSave(localValue);
    const durableSavedAt = durable?.lastSavedAt || 0;
    const localSavedAt = local?.lastSavedAt || 0;
    if (durableSavedAt < localSavedAt) return false;
    // 같은 밀리초에 연속 저장되면 lastSavedAt이 같을 수 있다. 값까지 같을 때만 복구를 생략한다.
    if (durableSavedAt === localSavedAt && durableValue === localValue) return false;
    localStorage.setItem(SAVE_KEY, durableValue);
    return true;
  } catch {
    return false;
  }
}

// 연타 구매 등으로 저장이 몰려도 네이티브 브릿지 호출은 직렬화하고 마지막 값만 쓴다.
let _pending = null;
let _writing = false;
export function mirrorNativeSave(json) {
  try {
    if (durableBridge()?.write?.(json) === true) return true;
  } catch {}
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
  return false;
}

export function clearNativeSave() {
  let cleared = false;
  try { cleared = durableBridge()?.clear?.() === true; } catch {}
  if (!isNative()) return cleared;
  _pending = null;
  prefs().then((P) => P.remove({ key: SAVE_KEY })).catch(() => {});
  return cleared;
}

// 부팅 시 1회 — 미러가 localStorage보다 최신이면(=마지막 localStorage 쓰기가 유실된 경우)
// 클라우드 세이브와 동일한 단일 경로(adoptCloudData)로 채택한다.
export async function restoreNativeSave(gameState) {
  if (!isNative()) return false;
  // 유효한 동기 슬롯이 있으면 이미 부팅 전에 비교했다. 구형 비동기 슬롯이 이를 덮지 않게 한다.
  if (readDurableSave()) return false;
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
