import { iconHtml } from "./icon.js";
import { regions, regionFor, eraTheme } from "../data/regions.js";
import { shortNumber } from "../utils/format.js";
import { officeEvents, realEventIds } from "../data/events.js";
import { dexSets } from "../data/dexSets.js";
import { headlines, headlineById } from "../data/headlines.js";
import { eventChains, eventEndingById } from "../data/eventChains.js";
import { shareCard } from "./shareCard.js";
import { govStageFor } from "../world/dotChar.js";

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ymd = (ms) => { const d = new Date(ms); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`; };

// 전국 개표 지도 모달 — 간판 탭으로 열림("gp:open-map" 이벤트).
// 정복한 구역(✓)·현재 구역(진행%)·잠긴 구역을 세로 경로로 보여준다.
export class DOMMapModal {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-map-ov";
    this.root.hidden = true;
    this.root.addEventListener("click", (e) => {
      // 도감 상세가 열려 있으면 거기부터 처리(지도 닫힘보다 우선)
      if (this._detailOpen) {
        const share = e.target.closest(".gp-dexdt__share");
        if (share) { this._share(share); return; }
        if (e.target.closest(".gp-dexdt__x") || e.target.classList.contains("gp-dexdt")) this._closeDexDetail();
        return;
      }
      const cell = e.target.closest(".gp-dex__cell[data-dexid]");
      if (cell) { this._openDexDetail(cell.dataset.dexid); return; }
      const hl = e.target.closest("[data-hlid]");
      if (hl) { this._openHeadlineDetail(hl.dataset.hlid); return; }
      const end = e.target.closest("[data-endid]");
      if (end) { this._openEndingDetail(end.dataset.endid); return; }
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
        nodes += `<div class="gp-map__era">${iconHtml(th.icon, { size: 32 })}${th.name}</div>`;
        lastEra = th.key;
      }
      const r = regionFor(a);
      const state = a < area ? "done" : a === area ? "cur" : "lock";
      const st = a < area ? "정복 ✓" : a === area ? `${pct}%` : "잠김";
      nodes += `<div class="gp-mapnode gp-mapnode--${state}">
        <span class="gp-mapnode__ic">${a < area ? "✓" : a === area ? "▶" : iconHtml("ui-lock", { size: 32 })}</span>
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

    // 사건 도감 — 겪은(해결한) 개표국 사건 수집 현황(영구). 미수집은 잠금 표시.
    const total = officeEvents.length;
    const seenN = gs.seenEventCount();
    const dexPct = Math.round(gs.dexBonusPct() * 100);
    const nextM = gs.nextDexMilestone();
    const dexBonusLine = nextM
      ? `현재 생산 +${dexPct}% · ${nextM.n}종 수집 시 +${Math.round(nextM.pct * 100)}%`
      : `전종 수집 완료! 생산 +${dexPct}% 영구`;
    // 세트별로 묶어 보여 준다 — 완성 세트는 효과가 영구 적용(중기 #6)
    const evById = Object.fromEntries(officeEvents.map((e) => [e.id, e]));
    const cell = (ev) => {
      const got = gs.hasSeenEvent(ev.id);
      const real = realEventIds.has(ev.id);
      if (!got) return `<div class="gp-dex__cell gp-dex__cell--lock" title="미발견 사건">？</div>`;
      const cls = real ? "gp-dex__cell gp-dex__cell--real" : "gp-dex__cell";
      return `<div class="${cls}" data-dexid="${ev.id}" title="${ev.title.replace(/"/g, "&quot;")}">${ev.title}</div>`;
    };
    const setDone = dexSets.filter((s) => gs.dexSetProgress(s).done).length;
    const dexCells = dexSets.map((s) => {
      const p = gs.dexSetProgress(s);
      return `<div class="gp-dexgrp${p.done ? " gp-dexgrp--done" : ""}"><div class="gp-dexgrp__hd"><b>${s.name}</b><span>${p.got}/${p.total}</span><em>${s.effectText}${p.done ? " · 적용 중" : ""}</em></div><div class="gp-dex">${s.events.map((id) => evById[id]).filter(Boolean).map(cell).join("")}</div></div>`;
    }).join("");

    // 헤드라인 스크랩 — 조건부 희귀 헤드라인(장기 #6). 미수집 칸은 조건 힌트를 보여 준다.
    const gotHl = gs.data.headlines || {};
    const hlN = gs.headlineCount();
    const hlPct = Math.round(gs.headlineBonusPct() * 100);
    const nextHl = gs.nextHeadlineMilestone();
    const hlBonusLine = nextHl
      ? `${hlPct ? `현재 생산 +${hlPct}% · ` : ""}${nextHl.n}장 스크랩 시 +${Math.round(nextHl.pct * 100)}%`
      : `전부 스크랩! 생산 +${hlPct}% 영구`;
    const hlRows = headlines.map((h) => (gotHl[h.id]
      ? `<button class="gp-hl" data-hlid="${h.id}"><s>${esc(h.outlet)}</s><b>${esc(h.text)}</b></button>`
      : `<div class="gp-hl gp-hl--lock"><s>？</s><b>${esc(h.hint)}</b></div>`)).join("");

    // 사건 결말 — 체인마다 세 결말(A 일관·B 일관·혼합)
    const endN = gs.eventEndingCount();
    const endT = gs.eventEndingTotal();
    const endGroups = eventChains.map((chain) => {
      const ends = Object.values(chain.endings);
      const got = ends.filter((en) => gs.data.eventEndings?.[en.id]).length;
      const cells = ends.map((en) => (gs.data.eventEndings?.[en.id]
        ? `<div class="gp-dex__cell gp-dex__cell--real" data-endid="${en.id}">${esc(en.title)}</div>`
        : `<div class="gp-dex__cell gp-dex__cell--lock">？</div>`)).join("");
      return `<div class="gp-dexgrp${got === ends.length ? " gp-dexgrp--done" : ""}"><div class="gp-dexgrp__hd"><b>${esc(chain.title)}</b><span>${got}/${ends.length}</span></div><div class="gp-dex">${cells}</div></div>`;
    }).join("");

    this.root.innerHTML = `<div class="gp-map">
      <div class="gp-map__hd"><span>${iconHtml("ui-map", { size: 32 })}전국 개표 지도</span><button class="gp-map__x" aria-label="닫기">✕</button></div>
      <div class="gp-map__sub">정복 ${done} · 현재 ${area}구역 · 누적 ${shortNumber(gs.data.votes)}표</div>
      <div class="gp-map__list">${nodes}
        <div class="gp-map__era">${iconHtml("staff-analyst", { size: 32 })}내 개표 기록</div>
        <div class="gp-stats">${statRows}</div>
        <div class="gp-map__era">${iconHtml("ui-book", { size: 32 })}사건 도감 <span class="gp-dex__count">${seenN}/${total}종 · 세트 ${setDone}/${dexSets.length}</span></div>
        <div class="gp-dex__bonus">${dexBonusLine}</div>
        ${dexCells}
        <div class="gp-map__era">${iconHtml("ui-star", { size: 32 })}헤드라인 스크랩 <span class="gp-dex__count">${hlN}/${headlines.length}</span></div>
        <div class="gp-dex__bonus">${hlBonusLine}</div>
        <div class="gp-hls">${hlRows}</div>
        <div class="gp-map__era">${iconHtml("ui-flag", { size: 32 })}사건 결말 <span class="gp-dex__count">${endN}/${endT}</span></div>
        ${endGroups}
      </div>
      <div class="gp-map__foot">구역을 정복할수록 더 높은 권위의 개표소로 이동합니다<br><span class="gp-disclaimer">※ 창작 픽션 — 실존 기관·인물·단체와 무관하며 비방 의도가 없습니다</span></div>
    </div>`;
  }

  // 수집한 사건을 다시 읽는 도감 상세 — 본문 + 두 선택지(읽기 전용)
  _openDexDetail(id) {
    const ev = officeEvents.find((v) => v.id === id);
    if (!ev || !this.gameState.hasSeenEvent(id)) return;
    const real = realEventIds.has(id);
    const choice = (side, label) => `<div class="gp-dexdt__opt">
      <b>${label}. ${esc(side[0])}</b>
      <s>${esc(side[2])}</s>
    </div>`;
    const el = document.createElement("div");
    el.className = "gp-dexdt";
    el.innerHTML = `<div class="gp-dexdt__card">
      <div class="gp-dexdt__hd">${esc(ev.title)}<button class="gp-dexdt__x" aria-label="닫기">✕</button></div>
      <div class="gp-dexdt__meta">${real ? "영감받은 각색 · " : ""}${ev.minStage || 1}구역부터 등장</div>
      <div class="gp-dexdt__body">${esc(ev.body)}</div>
      <div class="gp-dexdt__opts">${choice(ev.left, "A")}${choice(ev.right, "B")}</div>
      <div class="gp-dexdt__foot">눌러서 닫기</div>
    </div>`;
    this.root.appendChild(el);
    this._detailOpen = el;
  }

  _dateline(ms) {
    const area = this.gameState.data.stage.area;
    return `${area}구역 · ${regionFor(area).name} · ${ymd(ms)}`;
  }

  _photo() {
    return `/art/world/gov-${govStageFor(this.gameState.data)}.webp`;
  }

  _openCard({ title, meta, body, extra = "", card }) {
    const el = document.createElement("div");
    el.className = "gp-dexdt";
    el.innerHTML = `<div class="gp-dexdt__card">
      <div class="gp-dexdt__hd">${esc(title)}<button class="gp-dexdt__x" aria-label="닫기">✕</button></div>
      <div class="gp-dexdt__meta">${esc(meta)}</div>
      <div class="gp-dexdt__body">${esc(body)}</div>
      ${extra}
      <div class="gp-dexdt__act"><button class="gp-dexdt__share">공유</button></div>
    </div>`;
    this.root.appendChild(el);
    this._detailOpen = el;
    this._card = card;
  }

  _openHeadlineDetail(id) {
    const h = headlineById(id);
    const at = this.gameState.data.headlines?.[id];
    if (!h || !at) return;
    const when = at > 1 ? at : Date.now();
    this._openCard({
      title: h.outlet,
      meta: `${at > 1 ? `${ymd(at)} 스크랩 · ` : ""}${h.hint}`,
      body: h.text,
      card: { kicker: "특종", outlet: h.outlet, title: h.text, dateline: this._dateline(when), photo: this._photo() },
    });
  }

  _openEndingDetail(id) {
    const en = eventEndingById(id);
    if (!en || !this.gameState.data.eventEndings?.[id]) return;
    this._openCard({
      title: en.title,
      meta: en.chainTitle,
      body: en.body,
      extra: en.effectText ? `<div class="gp-dexdt__opts"><div class="gp-dexdt__opt"><s>${esc(en.effectText)}</s></div></div>` : "",
      card: { kicker: "사건 결말", outlet: en.chainTitle, title: en.title, body: en.body, dateline: this._dateline(Date.now()), photo: this._photo() },
    });
  }

  async _share(btn) {
    if (!this._card || btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "만드는 중…";
    const r = await shareCard(this._card);
    btn.textContent = r === "saved" ? "이미지 저장됨" : r === "failed" ? "공유 실패 · 다시" : "공유";
    btn.disabled = false;
  }

  _closeDexDetail() {
    if (this._detailOpen) { this._detailOpen.remove(); this._detailOpen = null; this._card = null; }
  }

  close() {
    this._closeDexDetail();
    this.root.hidden = true;
  }

  destroy() {
    document.removeEventListener("gp:open-map", this._open);
    this.root.remove();
  }
}
