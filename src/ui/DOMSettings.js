import { iconHtml } from "./icon.js";
import pkg from "../../package.json";
import { cloudEnabled } from "../firebaseConfig.js";
import { mirrorNativeSave, clearNativeSave } from "../state/persistence.js";
import { a11yPrefs, setA11yPref } from "./a11y.js";
import { devicePrefs, setDevicePref } from "./devicePrefs.js";
import { loadPrefs } from "../audio/audioPrefs.js";

const SAVE_KEY = "trust-office-phaser-v2";
const PRIVACY_URL = "https://gaepyo-tycoon.web.app/privacy.html";

const toggle = (act, label, on) =>
  `<div class="gp-set__row"><span>${label}</span><button class="gp-btn gp-btn--sm" data-set="${act}" aria-pressed="${on}">${on ? "켜짐" : "꺼짐"}</button></div>`;

// 설정 모달 — HUD ⚙️ 버튼("gp:open-settings")으로 열림.
// 배경음·효과음(음량)·진동, 알림, 절전·화면 켜두기, 세이브 백업/복원, 데이터 초기화, 버전·크레딧·개인정보·면책 고지를 한곳에.
export class DOMSettings {
  constructor(gameState, notifications) {
    this.gameState = gameState;
    this.notifications = notifications;
    this._audio = loadPrefs();
    // 슬라이더를 끄는 중 다시 그리면 드래그가 끊기므로 값만 받아 둔다
    this._onAudio = (e) => { this._audio = e.detail; };
    document.addEventListener("gp:audio-changed", this._onAudio);

    this.root = document.createElement("div");
    this.root.className = "gp-map-ov gp-settings-ov";
    this.root.hidden = true;
    this.root.addEventListener("click", (e) => this._onClick(e));
    this.root.addEventListener("input", (e) => this._onVol(e, "input"));
    this.root.addEventListener("change", (e) => this._onVol(e, "change"));
    this._open = () => this.open();
    document.addEventListener("gp:open-settings", this._open);
  }

  mount(parent) { parent.appendChild(this.root); }

  open() {
    this._render();
    this.root.hidden = false;
  }

  close() { this.root.hidden = true; this._resetArmed = false; }

  _render() {
    const n = this.notifications;
    const bellLabel = `<span>${iconHtml("ui-bell", { size: 32 })}알림</span>`;
    const bellRow = n && n.supported && n.supported() && n.granted()
      ? `<div class="gp-set__row">${bellLabel}<button class="gp-btn gp-btn--sm" data-set="bell">${n.muted() ? "꺼짐" : "켜짐"}</button></div>`
      : n && n.canAsk && n.canAsk()
        ? `<div class="gp-set__row">${bellLabel}<button class="gp-btn gp-btn--sm" data-set="bell-ask">켜기</button></div>`
        : "";
    const a11y = a11yPrefs();
    const dev = devicePrefs();
    const vibrateRow = typeof navigator !== "undefined" && navigator.vibrate ? toggle("vibrate", "진동", this._audio.vibrate) : "";
    const keepRow = globalThis.GaepyoScreenBridge || (typeof navigator !== "undefined" && navigator.wakeLock)
      ? toggle("keepawake", "화면 켜두기", dev.keepAwake) : "";
    const cloudRow = cloudEnabled()
      ? `<div class="gp-set__row"><span>클라우드 저장</span><b class="gp-set__ok">자동 동기화 중</b></div>`
      : "";
    this.root.innerHTML = `<div class="gp-map gp-settings">
      <div class="gp-map__hd"><span>${iconHtml("ui-gear", { size: 32 })}설정</span><button class="gp-map__x" aria-label="닫기">✕</button></div>
      <div class="gp-map__list gp-set__list">
        <div class="gp-map__era">소리</div>
        ${this._audioRow("bgm", "배경음")}
        ${this._audioRow("sfx", "효과음")}
        ${vibrateRow}
        ${bellRow}
        ${cloudRow}
        <div class="gp-map__era">기기</div>
        ${toggle("saver", "절전 모드 (30fps)", dev.saver)}
        ${keepRow}
        <div class="gp-map__era">보기</div>
        ${toggle("bigtext", "큰 글씨", a11y.bigText)}
        ${toggle("reducemotion", "움직임 줄이기", a11y.reduceMotion)}
        <div class="gp-map__era">데이터</div>
        <div class="gp-set__row"><span>세이브 내보내기</span><button class="gp-btn gp-btn--sm" data-set="export">복사</button></div>
        <div class="gp-set__row"><span>세이브 가져오기</span><button class="gp-btn gp-btn--sm" data-set="import">붙여넣기</button></div>
        <div class="gp-set__row"><span>처음부터 다시 시작</span><button class="gp-btn gp-btn--sm gp-set__danger" data-set="reset">${this._resetArmed ? "정말 삭제!" : "초기화"}</button></div>
        <div class="gp-map__era">정보</div>
        <div class="gp-set__row"><span>버전</span><b>v${pkg.version}</b></div>
        <div class="gp-set__row"><span>개인정보처리방침</span><button class="gp-btn gp-btn--sm" data-set="privacy">보기</button></div>
        <div class="gp-set__note">폰트: Jua·Do Hyeon(우아한형제들), Galmuri(quiple) — SIL OFL · 아트 출처: /art/CREDITS.md · 엔진: Phaser 3</div>
        <div class="gp-set__note">※ 본 게임은 창작 픽션입니다. 등장하는 기관·사건·인물은 실존과 무관하며 특정 대상을 비방할 의도가 없습니다.</div>
      </div>
    </div>`;
  }

  async _onClick(e) {
    if (e.target === this.root || e.target.closest(".gp-map__x")) { this.close(); return; }
    const btn = e.target.closest("[data-set]");
    if (!btn) return;
    const act = btn.dataset.set;
    if (act === "bgm" || act === "sfx" || act === "vibrate") {
      this._audio = { ...this._audio, [act]: !this._audio[act] };
      document.dispatchEvent(new CustomEvent("gp:audio-set", { detail: { [act]: this._audio[act] } }));
      this._render();
    } else if (act === "saver") {
      setDevicePref("saver", !devicePrefs().saver);
      this._render();
    } else if (act === "keepawake") {
      setDevicePref("keepAwake", !devicePrefs().keepAwake);
      this._render();
    } else if (act === "bell") {
      const n = this.notifications;
      if (n) { n.setMuted(!n.muted()); this._render(); }
    } else if (act === "bell-ask") {
      const n = this.notifications;
      if (n) n.requestPermission().catch(() => {}).finally(() => { if (!this.root.hidden) this._render(); });
    } else if (act === "bigtext") {
      setA11yPref("bigText", !a11yPrefs().bigText);
      this._render();
    } else if (act === "reducemotion") {
      setA11yPref("reduceMotion", !a11yPrefs().reduceMotion);
      this._render();
    } else if (act === "export") {
      try {
        this.gameState.save(false);
        const txt = localStorage.getItem(SAVE_KEY) || "";
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(txt);
        } else {
          // Android WebView 폴백 — Async Clipboard 미지원
          const ta = document.createElement("textarea");
          ta.value = txt; ta.style.cssText = "position:fixed;opacity:0";
          document.body.appendChild(ta); ta.select();
          document.execCommand("copy"); ta.remove();
        }
        btn.textContent = "복사됨!";
      } catch { btn.textContent = "실패"; }
    } else if (act === "import") {
      try {
        let txt = "";
        if (navigator.clipboard?.readText) txt = await navigator.clipboard.readText();
        if (!txt) txt = window.prompt("세이브 데이터를 붙여넣으세요") || ""; // WebView 폴백
        const parsed = JSON.parse(txt); // 유효성 검사
        if (!parsed || typeof parsed !== "object" || !parsed.stage) throw new Error("bad save");
        this.gameState._suspendPersist = true; // pagehide 저장이 덮어쓰지 않게
        localStorage.setItem(SAVE_KEY, txt);
        mirrorNativeSave(txt); // 네이티브 미러가 예전 세이브를 되살리지 않게 함께 갱신
        btn.textContent = "적용됨! 재시작…";
        setTimeout(() => location.reload(), 600);
      } catch { btn.textContent = "잘못된 데이터"; }
    } else if (act === "reset") {
      if (!this._resetArmed) {
        // 2단 확인 — 한 번 더 눌러야 실제 삭제
        this._resetArmed = true;
        this._render();
      } else {
        this.gameState._suspendPersist = true; // pagehide 저장이 세이브를 되살리지 않게
        try { localStorage.removeItem(SAVE_KEY); } catch {}
        clearNativeSave(); // 네이티브 미러도 함께 삭제 — 리셋 후 복원 방지
        location.reload();
      }
    } else if (act === "privacy") {
      window.open(PRIVACY_URL, "_blank", "noopener");
    }
  }

  _audioRow(key, label) {
    const on = this._audio[key];
    const vol = Math.round((this._audio[`${key}Vol`] ?? 0) * 100);
    return `<div class="gp-set__row gp-set__row--vol"><span>${label}</span>
      <input class="gp-set__vol" type="range" min="0" max="100" step="5" value="${vol}" data-vol="${key}Vol" aria-label="${label} 음량"${on ? "" : " disabled"}>
      <button class="gp-btn gp-btn--sm" data-set="${key}" aria-pressed="${on}">${on ? "켜짐" : "꺼짐"}</button></div>`;
  }

  // 배경음은 끄는 동안 바로 반영, 효과음은 손을 뗄 때 한 번 미리 들려준다
  _onVol(e, type) {
    const el = e.target.closest?.("[data-vol]");
    if (!el) return;
    const key = el.dataset.vol;
    if (key === "sfxVol" && type === "input") return;
    const v = Math.min(1, Math.max(0, Number(el.value) / 100));
    this._audio = { ...this._audio, [key]: v };
    document.dispatchEvent(new CustomEvent("gp:audio-set", { detail: { [key]: v } }));
  }

  destroy() {
    document.removeEventListener("gp:open-settings", this._open);
    document.removeEventListener("gp:audio-changed", this._onAudio);
    this.root.remove();
  }
}
