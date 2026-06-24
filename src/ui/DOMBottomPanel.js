import { shortNumber } from "../utils/format.js";

const TABS = [
  ["facilities", "시설"],
  ["crew", "직원"],
  ["events", "사건"],
  ["goals", "목표"],
  ["prestige", "감사"],
];

export class DOMBottomPanel {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-bottom";
    this.root.innerHTML = `
      <div class="gp-card">
        <div class="gp-card__icon"></div>
        <div class="gp-card__body">
          <div class="gp-card__title" data-k="title">접수창구 Lv.0</div>
          <div class="gp-card__sub" data-k="sub"></div>
        </div>
        <button class="gp-btn" data-k="upgrade">업그레이드</button>
      </div>
      <div class="gp-tabs" data-k="tabs"></div>`;

    const tabsEl = this.root.querySelector('[data-k="tabs"]');
    TABS.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.className = "gp-tab";
      b.dataset.tab = id;
      b.textContent = label;
      b.addEventListener("click", () => this.gameState.setTab(id));
      tabsEl.appendChild(b);
    });

    this.root.querySelector('[data-k="upgrade"]').addEventListener("click", () => {
      this.gameState.select("desk");
      this.gameState.upgrade("desk");
    });

    this._refresh = () => this.refresh();
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.gameState.on("changed", this._refresh);
    this.refresh();
  }

  refresh() {
    const gs = this.gameState;
    const level = gs.level("desk");
    const cost = gs.cost("desk");
    const explainCost = gs.explainCost("desk");
    const canBuy = gs.data.votes >= cost && gs.data.explain >= explainCost;
    this.root.querySelector('[data-k="title"]').textContent = `접수창구 Lv.${level}`;
    this.root.querySelector('[data-k="sub"]').textContent = `${shortNumber(cost)}표 · 해명 ${explainCost}`;
    const btn = this.root.querySelector('[data-k="upgrade"]');
    btn.classList.toggle("gp-btn--disabled", !canBuy);
    this.root.querySelectorAll(".gp-tab").forEach((el) => {
      el.classList.toggle("gp-tab--active", el.dataset.tab === gs.data.activeTab);
    });
  }

  destroy() {
    this.gameState.off("changed", this._refresh);
    this.root.remove();
  }
}
