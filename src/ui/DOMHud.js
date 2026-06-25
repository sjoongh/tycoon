import { shortNumber } from "../utils/format.js";

export class DOMHud {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-hud";
    this.root.innerHTML = `
      <div class="gp-hud__row">
        <div class="gp-chip gp-chip--votes"><span class="gp-chip__ic" style="background-image:url('/art/icons/votes.webp')"></span><span><div class="gp-chip__label">표</div><div class="gp-chip__val" data-k="votes">0</div></span></div>
        <div class="gp-chip gp-chip--explain"><span class="gp-chip__ic" style="background-image:url('/art/icons/explain.webp')"></span><span><div class="gp-chip__label">해명</div><div class="gp-chip__val" data-k="explain">0</div></span></div>
        <div class="gp-chip gp-chip--trust"><span class="gp-chip__ic" style="background-image:url('/art/icons/trust.webp')"></span><span><div class="gp-chip__label">믿음</div><div class="gp-chip__val" data-k="trust">0%</div></span></div>
      </div>
      <div class="gp-progress"><div class="gp-progress__fill" data-k="progress"></div></div>
      <div class="gp-stage" data-k="stage"></div>
      <div class="gp-truststate" data-k="truststate" hidden></div>`;
    this._refresh = () => this.refresh();
    // FIX #1: mute button created separately so it mounts on .gp-ui root (above HUD),
    // preventing overlap with the 믿음 chip on the right side.
    this._muteBtn = document.createElement("button");
    this._muteBtn.className = "gp-mute";
    this._muteBtn.setAttribute("aria-label", "소리");
    this._muteBtn.textContent = "🔊";
    this._muteBtn.addEventListener("click", () => document.dispatchEvent(new CustomEvent("gp:toggle-mute")));
    this._onMute = (e) => { this._muteBtn.textContent = e.detail ? "🔇" : "🔊"; };
    document.addEventListener("gp:mute-changed", this._onMute);
  }

  mount(parent) {
    parent.appendChild(this.root);
    // Attach mute to the .gp-ui container (parent), not inside the HUD flex row
    parent.appendChild(this._muteBtn);
    this.gameState.on("changed", this._refresh);
    this.refresh();
  }

  refresh() {
    const d = this.gameState.data;
    this.root.querySelector('[data-k="votes"]').textContent = shortNumber(d.votes);
    this.root.querySelector('[data-k="explain"]').textContent = shortNumber(d.explain);
    this.root.querySelector('[data-k="trust"]').textContent = `${Math.round(d.trust)}%`;
    const ratio = Math.max(0, Math.min(1, d.stage.progress / d.stage.target));
    this.root.querySelector('[data-k="progress"]').style.width = `${ratio * 100}%`;
    const cps = this.gameState.cps ? this.gameState.cps() : 0;
    // 초당 생산이 의미있게 뛰면(업그레이드/채용/구역) 수치를 팝 연출. 믿음 드리프트(<2%)는 무시.
    const jumped = this._lastCps != null && cps >= this._lastCps * 1.02;
    this._lastCps = cps;

    // 믿음 위기/보너스 상태를 믿음 칩과 상태 배지로 노출(테마 시그니처)
    const state = this.gameState.trustState ? this.gameState.trustState() : "normal";
    const chip = this.root.querySelector(".gp-chip--trust");
    chip.classList.toggle("gp-chip--crisis", state === "crisis");
    chip.classList.toggle("gp-chip--bonus", state === "bonus");
    // P1 fix: collapse trust-state badge into .gp-stage pill (saves ~26px HUD height)
    // The separate .gp-truststate row is hidden; inline suffix signals state at zero cost.
    const badge = this.root.querySelector('[data-k="truststate"]');
    badge.hidden = true;
    const stageEl = this.root.querySelector('[data-k="stage"]');
    const stateSuffix = state === "crisis"
      ? ` · <span style="color:#ff9a9a">⚠ 불신위기</span>`
      : state === "bonus"
      ? ` · <span style="color:#8df0b0">✦ 신뢰보너스</span>`
      : "";
    stageEl.innerHTML =
      `${d.stage.area}구역 · D-${d.days} · 초당 <span class="gp-cps${jumped ? " gp-cps--up" : ""}">${cps.toFixed(1)}</span>표${stateSuffix}`;
  }

  destroy() {
    this.gameState.off("changed", this._refresh);
    document.removeEventListener("gp:mute-changed", this._onMute);
    this._muteBtn.remove();
    this.root.remove();
  }
}
