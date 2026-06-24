import { shortNumber } from "../utils/format.js";

export class DOMHud {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-hud";
    this.root.innerHTML = `
      <div class="gp-hud__row">
        <div class="gp-chip"><span class="gp-chip__dot" style="background:#ffc857"></span><span><div class="gp-chip__label">표</div><div class="gp-chip__val" data-k="votes">0</div></span></div>
        <div class="gp-chip"><span class="gp-chip__dot" style="background:#7fc8ff"></span><span><div class="gp-chip__label">해명</div><div class="gp-chip__val" data-k="explain">0</div></span></div>
        <div class="gp-chip"><span class="gp-chip__dot" style="background:#89d98b"></span><span><div class="gp-chip__label">믿음</div><div class="gp-chip__val" data-k="trust">0%</div></span></div>
      </div>
      <div class="gp-progress"><div class="gp-progress__fill" data-k="progress"></div></div>
      <div class="gp-stage" data-k="stage"></div>`;
    this._refresh = () => this.refresh();
  }

  mount(parent) {
    parent.appendChild(this.root);
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
    this.root.querySelector('[data-k="stage"]').textContent = `${d.stage.area}구역 · 초당 ${cps.toFixed(1)}표 · 인장 ${d.prestige.seals}`;
  }

  destroy() {
    this.gameState.off("changed", this._refresh);
    this.root.remove();
  }
}
