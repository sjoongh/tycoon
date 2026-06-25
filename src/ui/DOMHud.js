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

    // 긴급 개표(러시) 부스트 FAB — 액티브 플레이 비트
    this._rushBtn = document.createElement("button");
    this._rushBtn.className = "gp-rush";
    this._rushBtn.addEventListener("click", () => { if (this.gameState.activateRush) this.gameState.activateRush(); });

    // 긴급 브리핑 FAB(좌측) — 해명 소비 → 믿음 회복 + 생산 버프(액티브 트러스트 관리)
    this._briefBtn = document.createElement("button");
    this._briefBtn.className = "gp-brief";
    this._briefBtn.addEventListener("click", () => { if (this.gameState.activateBrief) this.gameState.activateBrief(); });
  }

  mount(parent) {
    parent.appendChild(this.root);
    // Attach mute to the .gp-ui container (parent), not inside the HUD flex row
    parent.appendChild(this._muteBtn);
    parent.appendChild(this._rushBtn);
    parent.appendChild(this._briefBtn);
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

    this._refreshRush();
    this._refreshBrief();
  }

  _refreshBrief() {
    const gs = this.gameState;
    if (!gs.briefReady) return;
    const btn = this._briefBtn;
    if (gs.briefActive()) {
      btn.className = "gp-brief gp-brief--active";
      btn.disabled = true;
      btn.innerHTML = `<b>브리핑 효과</b><small>×1.5 · ${Math.ceil(gs.briefRemainingMs() / 1000)}초</small>`;
    } else if (!gs.briefReady()) {
      btn.className = "gp-brief gp-brief--cd";
      btn.disabled = true;
      btn.innerHTML = `<b>재정비 중</b><small>${Math.ceil(gs.briefCooldownRemainingMs() / 1000)}초</small>`;
    } else if (!gs.briefAffordable()) {
      btn.className = "gp-brief gp-brief--poor";
      btn.disabled = true;
      btn.innerHTML = `<b>긴급 브리핑</b><small>해명 ${shortNumber(gs.briefCost())} 필요</small>`;
    } else {
      btn.className = "gp-brief gp-brief--ready";
      btn.disabled = false;
      btn.innerHTML = `<b>📢 긴급 브리핑</b><small>해명 ${shortNumber(gs.briefCost())} · 믿음+12</small>`;
    }
  }

  _refreshRush() {
    const gs = this.gameState;
    if (!gs.rushReady) return;
    const btn = this._rushBtn;
    if (gs.rushActive()) {
      btn.className = "gp-rush gp-rush--active";
      btn.disabled = true;
      btn.innerHTML = `<b>개표 폭주!</b><small>×5 · ${Math.ceil(gs.rushRemainingMs() / 1000)}초</small>`;
    } else if (gs.rushReady()) {
      btn.className = "gp-rush gp-rush--ready";
      btn.disabled = false;
      btn.innerHTML = `<b>⚡ 긴급 개표</b><small>20초 ×5</small>`;
    } else {
      btn.className = "gp-rush gp-rush--cd";
      btn.disabled = true;
      btn.innerHTML = `<b>충전 중</b><small>${Math.ceil(gs.rushCooldownRemainingMs() / 1000)}초</small>`;
    }
  }

  destroy() {
    this.gameState.off("changed", this._refresh);
    document.removeEventListener("gp:mute-changed", this._onMute);
    this._muteBtn.remove();
    this._rushBtn.remove();
    this._briefBtn.remove();
    this.root.remove();
  }
}
