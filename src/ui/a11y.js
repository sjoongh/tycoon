// 접근성 옵션(로드맵 #15): 큰 글씨 / 움직임 줄이기.
// 설정 화면 토글 → localStorage 저장 → <html> 클래스(gp-bigtext / gp-reduce-motion)로 CSS에 반영.
// motionReduced()는 OS 설정(prefers-reduced-motion)과 앱 토글을 합쳐 월드 연출(장식 효과)에서 참조한다.
const KEY = "gp-a11y-v1";
const DEFAULTS = Object.freeze({ bigText: false, reduceMotion: false });

let prefs = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { ...DEFAULTS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
}

export function a11yPrefs() { return { ...prefs }; }

export function setA11yPref(key, value) {
  if (!(key in DEFAULTS)) return;
  prefs = { ...prefs, [key]: !!value };
  save();
  applyA11yPrefs();
  if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("gp:a11y-changed", { detail: a11yPrefs() }));
}

export function applyA11yPrefs() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("gp-bigtext", prefs.bigText);
  root.classList.toggle("gp-reduce-motion", prefs.reduceMotion);
}

export function motionReduced() {
  if (prefs.reduceMotion) return true;
  try { return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

applyA11yPrefs();
