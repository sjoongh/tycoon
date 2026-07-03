import pkg from "../../package.json";
import { cloudEnabled } from "../firebaseConfig.js";

const SAVE_KEY = "trust-office-phaser-v2";
const PRIVACY_URL = "https://gaepyo-tycoon.web.app/privacy.html";

// 설정 모달 — HUD ⚙️ 버튼("gp:open-settings")으로 열림.
// 사운드/알림 토글, 세이브 백업/복원, 데이터 초기화, 버전·크레딧·개인정보·면책 고지를 한곳에.
export class DOMSettings {
  constructor(gameState, notifications) {
    this.gameState = gameState;
    this.notifications = notifications;
    this._muted = false;
    this._onMute = (e) => { this._muted = e.detail; this._syncRows(); };
    document.addEventListener("gp:mute-changed", this._onMute);

    this.root = document.createElement("div");
    this.root.className = "gp-map-ov gp-settings-ov";
    this.root.hidden = true;
    this.root.addEventListener("click", (e) => this._onClick(e));
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
    const bellRow = n && n.supported && n.supported() && n.granted()
      ? `<div class="gp-set__row"><span>🔔 알림</span><button class="gp-btn gp-btn--sm" data-set="bell">${n.muted() ? "꺼짐" : "켜짐"}</button></div>`
      : "";
    const cloudRow = cloudEnabled()
      ? `<div class="gp-set__row"><span>☁️ 클라우드 저장</span><b class="gp-set__ok">자동 동기화 중</b></div>`
      : "";
    this.root.innerHTML = `<div class="gp-map gp-settings">
      <div class="gp-map__hd"><span>⚙️ 설정</span><button class="gp-map__x" aria-label="닫기">✕</button></div>
      <div class="gp-map__list gp-set__list">
        <div class="gp-set__row"><span>🔊 소리</span><button class="gp-btn gp-btn--sm" data-set="mute">${this._muted ? "꺼짐" : "켜짐"}</button></div>
        ${bellRow}
        ${cloudRow}
        <div class="gp-map__era">💾 데이터</div>
        <div class="gp-set__row"><span>세이브 내보내기</span><button class="gp-btn gp-btn--sm" data-set="export">복사</button></div>
        <div class="gp-set__row"><span>세이브 가져오기</span><button class="gp-btn gp-btn--sm" data-set="import">붙여넣기</button></div>
        <div class="gp-set__row"><span>처음부터 다시 시작</span><button class="gp-btn gp-btn--sm gp-set__danger" data-set="reset">${this._resetArmed ? "정말 삭제!" : "초기화"}</button></div>
        <div class="gp-map__era">ℹ️ 정보</div>
        <div class="gp-set__row"><span>버전</span><b>v${pkg.version}</b></div>
        <div class="gp-set__row"><span>개인정보처리방침</span><button class="gp-btn gp-btn--sm" data-set="privacy">보기</button></div>
        <div class="gp-set__note">폰트: Galmuri(quiple), Press Start 2P — OFL 라이선스 · 엔진: Phaser 3</div>
        <div class="gp-set__note">※ 본 게임은 창작 픽션입니다. 등장하는 기관·사건·인물은 실존과 무관하며 특정 대상을 비방할 의도가 없습니다.</div>
      </div>
      <div class="gp-map__foot">믿어주세요, 개표국</div>
    </div>`;
  }

  async _onClick(e) {
    if (e.target === this.root || e.target.closest(".gp-map__x")) { this.close(); return; }
    const btn = e.target.closest("[data-set]");
    if (!btn) return;
    const act = btn.dataset.set;
    if (act === "mute") {
      document.dispatchEvent(new CustomEvent("gp:toggle-mute"));
      this._render();
    } else if (act === "bell") {
      const n = this.notifications;
      if (n) { n.setMuted(!n.muted()); this._render(); }
    } else if (act === "export") {
      try {
        this.gameState.save(false);
        await navigator.clipboard.writeText(localStorage.getItem(SAVE_KEY) || "");
        btn.textContent = "복사됨!";
      } catch { btn.textContent = "실패"; }
    } else if (act === "import") {
      try {
        const txt = await navigator.clipboard.readText();
        const parsed = JSON.parse(txt); // 유효성 검사
        if (!parsed || typeof parsed !== "object" || !parsed.stage) throw new Error("bad save");
        localStorage.setItem(SAVE_KEY, txt);
        btn.textContent = "적용됨! 재시작…";
        setTimeout(() => location.reload(), 600);
      } catch { btn.textContent = "잘못된 데이터"; }
    } else if (act === "reset") {
      if (!this._resetArmed) {
        // 2단 확인 — 한 번 더 눌러야 실제 삭제
        this._resetArmed = true;
        this._render();
      } else {
        try { localStorage.removeItem(SAVE_KEY); } catch {}
        location.reload();
      }
    } else if (act === "privacy") {
      window.open(PRIVACY_URL, "_blank", "noopener");
    }
  }

  _syncRows() { if (!this.root.hidden) this._render(); }

  destroy() {
    document.removeEventListener("gp:open-settings", this._open);
    document.removeEventListener("gp:mute-changed", this._onMute);
    this.root.remove();
  }
}
