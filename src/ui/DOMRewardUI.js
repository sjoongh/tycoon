// 보상 슬롯 UI — 골든 결과 키우기 토스트 + 생산 2배 부스트 칩.
// 광고 모드(AdMob)면 "▶ 광고 보고 …", 무료 모드면 쿨다운 무료 보상으로 같은 자리를 쓴다.
import { rewardStatus, rewardLabel, claimReward } from "../ads/rewardSlot.js";

function fmtWait(ms) {
  const s = Math.ceil(ms / 1000);
  if (s >= 3600) return `${Math.floor(s / 3600)}시간 ${Math.floor((s % 3600) / 60)}분`;
  if (s >= 60) return `${Math.floor(s / 60)}분`;
  return `${s}초`;
}
function fmtClock(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

export class DOMRewardUI {
  constructor(gameState) {
    this.gameState = gameState;
    this._busy = false;
  }

  mount(parent) {
    this.parent = parent;
    // 골든 결과 키우기 토스트
    this.toast = document.createElement("div");
    this.toast.className = "gp-rtoast";
    this.toast.hidden = true;
    parent.appendChild(this.toast);
    this._onOffer = (e) => this._offer(e.detail);
    document.addEventListener("gp:reward-offer", this._onOffer);
    // 생산 2배 부스트 칩(오늘의 할 일 칩 아래)
    this.boost = document.createElement("button");
    this.boost.className = "gp-boost";
    this.boost.addEventListener("click", () => this._claimBoost());
    parent.appendChild(this.boost);
    this._tick = setInterval(() => this._syncBoost(), 1000);
    this._syncBoost();
  }

  destroy() {
    document.removeEventListener("gp:reward-offer", this._onOffer);
    clearInterval(this._tick);
    clearTimeout(this._toastTimer);
    this.toast?.remove();
    this.boost?.remove();
  }

  _offer({ kind, out }) {
    const st = rewardStatus(kind);
    if (!st.ready) return;
    clearTimeout(this._toastTimer);
    const what = out.kind === "donation" ? "후원금" : "특보 시간";
    this.toast.innerHTML = `<span>${what}</span><button class="gp-btn gp-btn--gold gp-btn--sm" data-k="go">${out.kind === "donation" ? rewardLabel(kind) : rewardLabel(kind).replace("3배로 받기", "2배로 늘리기")}</button><button class="gp-rtoast__x" data-k="x" aria-label="닫기">✕</button>`;
    this.toast.hidden = false;
    this.toast.querySelector('[data-k="x"]').onclick = () => { this.toast.hidden = true; };
    this.toast.querySelector('[data-k="go"]').onclick = async () => {
      if (this._busy) return;
      this._busy = true;
      const ok = await claimReward(kind);
      this._busy = false;
      this.toast.hidden = true;
      if (ok) this.gameState.amplifyGolden(out);
    };
    this._toastTimer = setTimeout(() => { this.toast.hidden = true; }, 8000);
  }

  _syncBoost() {
    const gs = this.gameState;
    if (!gs.data.tutorial?.done) { this.boost.hidden = true; return; }
    this.boost.hidden = false;
    const left = gs.boostRemainingMs ? gs.boostRemainingMs() : 0;
    let html; let cls = "gp-boost";
    if (left > 0) { html = `<b>생산 2배</b><span>${fmtClock(left)}</span>`; cls += " gp-boost--on"; }
    else {
      const st = rewardStatus("boost");
      if (st.ready) { html = `<b>${rewardLabel("boost")}</b>`; cls += " gp-boost--ready"; }
      else html = `<b>생산 2배</b><span>${st.capped ? "오늘 끝" : `${fmtWait(st.waitMs)} 후`}</span>`;
    }
    if (this.boost.innerHTML !== html) this.boost.innerHTML = html;
    this.boost.className = cls;
  }

  async _claimBoost() {
    const gs = this.gameState;
    if (this._busy || gs.boostRemainingMs() > 0) return;
    if (!rewardStatus("boost").ready) return;
    this._busy = true;
    const ok = await claimReward("boost");
    this._busy = false;
    if (ok) gs.activateBoost(4);
    this._syncBoost();
  }
}
