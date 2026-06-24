import { shortNumber } from "../utils/format.js";
import { facilities } from "../data/facilities.js";

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
        <div class="gp-card__icon" data-k="icon"></div>
        <div class="gp-card__body">
          <div class="gp-card__title" data-k="title"></div>
          <div class="gp-card__sub" data-k="sub"></div>
        </div>
        <button class="gp-btn" data-k="upgrade">업그레이드</button>
      </div>
      <div class="gp-facsel" data-k="facsel"></div>
      <div class="gp-tabs" data-k="tabs"></div>`;

    const facEl = this.root.querySelector('[data-k="facsel"]');
    facilities.forEach((f) => {
      const b = document.createElement("button");
      b.className = "gp-fac";
      b.dataset.fac = f.id;
      b.innerHTML = `<span class="gp-fac__role">${f.role}</span><span class="gp-fac__lv" data-k="lv-${f.id}"></span>`;
      b.addEventListener("click", () => this.gameState.select(f.id));
      facEl.appendChild(b);
    });

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
      this.gameState.upgrade(this.gameState.data.selected);
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
    const sel = gs.facility(gs.data.selected) ? gs.data.selected : "desk";
    const f = gs.facility(sel);
    const unlocked = gs.isUnlocked(sel);
    const cost = gs.cost(sel);
    const explainCost = gs.explainCost(sel);
    const canBuy = unlocked && gs.data.votes >= cost && gs.data.explain >= explainCost;

    this.root.querySelector('[data-k="title"]').textContent = `${f.name} Lv.${gs.level(sel)}`;
    this.root.querySelector('[data-k="sub"]').textContent = unlocked
      ? `${shortNumber(cost)}표 · 해명 ${explainCost}`
      : `${f.unlock}구역에서 해금`;
    this.root.querySelector('[data-k="icon"]').style.background = "#" + f.color.toString(16).padStart(6, "0");
    const btn = this.root.querySelector('[data-k="upgrade"]');
    btn.classList.toggle("gp-btn--disabled", !canBuy);
    btn.textContent = unlocked ? "업그레이드" : "잠김";

    facilities.forEach((ff) => {
      const b = this.root.querySelector(`[data-fac="${ff.id}"]`);
      const u = gs.isUnlocked(ff.id);
      b.classList.toggle("gp-fac--active", ff.id === sel);
      b.classList.toggle("gp-fac--locked", !u);
      b.style.borderColor = "#" + ff.color.toString(16).padStart(6, "0");
      this.root.querySelector(`[data-k="lv-${ff.id}"]`).textContent = u ? `Lv.${gs.level(ff.id)}` : `${ff.unlock}구`;
    });

    this.root.querySelectorAll(".gp-tab").forEach((el) => {
      el.classList.toggle("gp-tab--active", el.dataset.tab === gs.data.activeTab);
    });
  }

  destroy() {
    this.gameState.off("changed", this._refresh);
    this.root.remove();
  }
}
