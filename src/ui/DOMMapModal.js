import { regions, regionFor, eraTheme } from "../data/regions.js";
import { shortNumber } from "../utils/format.js";
import { officeEvents, realEventIds } from "../data/events.js";

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
    let lastEra = null;
    for (let a = 1; a <= maxNode; a++) {
      const th = eraTheme(a);
      if (th.key !== lastEra) {
        nodes += `<div class="gp-map__era">${th.icon} ${th.name}</div>`;
        lastEra = th.key;
      }
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

    // 내 개표 기록(누적 통계) — 성취감/리텐션
    const s = gs.data.stats || {};
    const pr = gs.data.prestige || {};
    const offH = ((s.totalOfflineMs || 0) / 3600000).toFixed(1);
    const statRows = [
      ["누적 개표", `${shortNumber(s.totalVotes || 0)}표`],
      ["누적 클릭", `${shortNumber(s.totalClicks || 0)}회`],
      ["시설 증설", `${shortNumber(s.totalUpgrades || 0)}회`],
      ["사건 처리", `${s.totalEvents || 0}건`],
      ["아이템 획득", `${s.totalItems || 0}개`],
      ["감사 횟수", `${pr.runs || 0}회`],
      ["획득 훈장", `${pr.totalMedals || 0}개`],
      ["오프라인 적립", `${offH}시간`],
    ].map(([k, v]) => `<div class="gp-stat-row"><span>${k}</span><b>${v}</b></div>`).join("");

    // 사건 도감 — 겪은(해결한) 선관위 사건 수집 현황(영구). 미수집은 잠금 표시.
    const total = officeEvents.length;
    const seenN = gs.seenEventCount();
    const dexCells = officeEvents
      .slice()
      .sort((a, b) => (a.minStage || 1) - (b.minStage || 1))
      .map((ev) => {
        const got = gs.hasSeenEvent(ev.id);
        const real = realEventIds.has(ev.id);
        if (!got) return `<div class="gp-dex__cell gp-dex__cell--lock" title="미발견 사건">？</div>`;
        const cls = real ? "gp-dex__cell gp-dex__cell--real" : "gp-dex__cell";
        const mark = real ? "🏛 " : "";
        return `<div class="${cls}" title="${ev.title.replace(/"/g, "&quot;")}">${mark}${ev.title}</div>`;
      })
      .join("");

    this.root.innerHTML = `<div class="gp-map">
      <div class="gp-map__hd"><span>🗺 전국 개표 지도</span><button class="gp-map__x" aria-label="닫기">✕</button></div>
      <div class="gp-map__sub">정복 ${done} · 현재 ${area}구역 · 누적 ${shortNumber(gs.data.votes)}표</div>
      <div class="gp-map__list">${nodes}
        <div class="gp-map__era">📊 내 개표 기록</div>
        <div class="gp-stats">${statRows}</div>
        <div class="gp-map__era">📖 사건 도감 <span class="gp-dex__count">${seenN}/${total}종</span></div>
        <div class="gp-dex">${dexCells}</div>
      </div>
      <div class="gp-map__foot">구역을 정복할수록 더 높은 권위의 개표소로 이동합니다</div>
    </div>`;
  }

  destroy() {
    document.removeEventListener("gp:open-map", this._open);
    this.root.remove();
  }
}
