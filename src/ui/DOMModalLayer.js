import { shortNumber } from "../utils/format.js";

const MILESTONES = [5, 10, 25, 45];

// 오프라인 보상 모달 + 마일스톤 연출 + 신규 온보딩 힌트
export class DOMModalLayer {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-modal-layer";
    this._hint = null;
    this._onUpgraded = (f) => this._checkMilestone(f);
    this._onChanged = () => this._maybeHint();
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.gameState.on("upgraded", this._onUpgraded);
    this.gameState.on("changed", this._onChanged);
    this._showOfflineReward();
    this._maybeHint();
  }

  _showOfflineReward() {
    const r = this.gameState.consumeOfflineReward ? this.gameState.consumeOfflineReward() : null;
    if (!r) return;
    const mins = Math.max(1, Math.floor(r.elapsed / 60000));
    this._openModal(`
      <div class="gp-modal__badge">💤</div>
      <div class="gp-mtitle">오프라인 정산</div>
      <div class="gp-msub">${mins}분 동안 개표가 계속됐어요</div>
      <div class="gp-mbig">+${shortNumber(r.votes)}표<br><span>+${shortNumber(r.explain)} 해명</span></div>
      <button class="gp-btn" data-close>수령하기</button>`);
  }

  _checkMilestone(f) {
    if (!f) return;
    const lv = this.gameState.level(f.id);
    if (MILESTONES.includes(lv)) {
      this._toast(`🎉 ${f.name} Lv.${lv} 마일스톤!`);
      this._flash();
    }
  }

  _maybeHint() {
    const done = this.gameState.data.tutorial && this.gameState.data.tutorial.done;
    const tapped = (this.gameState.data.stats.totalClicks || 0) >= 3;
    const shouldShow = !done && !tapped;
    if (shouldShow && !this._hint) {
      this._hint = document.createElement("div");
      this._hint.className = "gp-hint";
      this._hint.innerHTML = `<div class="gp-hint__hand"></div><div class="gp-hint__txt">화면을 탭해 표를 처리하세요!</div>`;
      this.root.appendChild(this._hint);
    } else if (!shouldShow && this._hint) {
      this._hint.remove();
      this._hint = null;
    }
  }

  _openModal(html) {
    const ov = document.createElement("div");
    ov.className = "gp-modal-ov";
    ov.innerHTML = `<div class="gp-modal">${html}</div>`;
    ov.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]") || e.target === ov) ov.remove();
    });
    this.root.appendChild(ov);
  }

  _toast(text) {
    const t = document.createElement("div");
    t.className = "gp-toast";
    t.textContent = text;
    this.root.appendChild(t);
    requestAnimationFrame(() => t.classList.add("gp-toast--in"));
    setTimeout(() => {
      t.classList.remove("gp-toast--in");
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  _flash() {
    const fl = document.createElement("div");
    fl.className = "gp-flash";
    this.root.appendChild(fl);
    setTimeout(() => fl.remove(), 420);
  }

  destroy() {
    this.gameState.off("upgraded", this._onUpgraded);
    this.gameState.off("changed", this._onChanged);
    this.root.remove();
  }
}
