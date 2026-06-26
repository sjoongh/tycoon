import { regions, regionFor } from "../data/regions.js";
import { shortNumber } from "../utils/format.js";

// 전국 개표 지도 모달 — 간판 탭으로 열림("gp:open-map" 이벤트).
// 정복한 구역(✓)·현재 구역(진행%)·잠긴 구역을 세로 경로로 보여준다.
export class DOMMapModal {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-map-ov";
    this.root.hidden = true;
    this.root.addEventListener("click", (e) => {
      if (e.target === this.root || e.target.closest(".gp-map__x")) this.close();
    });
    this._open = () => this.open();
    document.addEventListener("gp:open-map", this._open);
  }

  mount(parent) {
    parent.appendChild(this.root);
  }

  open() {
    this._render();
    this.root.hidden = false;
    const cur = this.root.querySelector(".gp-mapnode--cur");
    if (cur) cur.scrollIntoView({ block: "center" });
  }

  close() {
    this.root.hidden = true;
  }

  _render() {
    const gs = this.gameState;
    const area = gs.data.stage.area;
    const target = gs.data.stage.target || 1;
    const pct = Math.floor((gs.data.stage.progress / target) * 100);
    const maxNode = Math.max(regions.length, area);

    let nodes = "";
    for (let a = 1; a <= maxNode; a++) {
      const r = regionFor(a);
      const state = a < area ? "done" : a === area ? "cur" : "lock";
      const st = a < area ? "정복 ✓" : a === area ? `${pct}%` : "잠김";
      nodes += `<div class="gp-mapnode gp-mapnode--${state}">
        <span class="gp-mapnode__ic">${a < area ? "✓" : a === area ? "▶" : "🔒"}</span>
        <span class="gp-mapnode__body"><b>${a}구역 · ${r.name}</b><s>${r.desc}</s></span>
        <span class="gp-mapnode__st">${st}</span>
      </div>`;
    }

    const done = area - 1;
    this.root.innerHTML = `<div class="gp-map">
      <div class="gp-map__hd"><span>🗺 전국 개표 지도</span><button class="gp-map__x" aria-label="닫기">✕</button></div>
      <div class="gp-map__sub">정복 ${done} · 현재 ${area}구역 · 누적 ${shortNumber(gs.data.votes)}표</div>
      <div class="gp-map__list">${nodes}</div>
      <div class="gp-map__foot">구역을 정복할수록 더 높은 권위의 개표소로 이동합니다</div>
    </div>`;
  }

  destroy() {
    document.removeEventListener("gp:open-map", this._open);
    this.root.remove();
  }
}
