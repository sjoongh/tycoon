import { shortNumber, formatDuration, rateNumber } from "../utils/format.js";
import { facilities } from "../data/facilities.js";
import { staffDefinitions, rarityColors } from "../data/staff.js";
import {
  STAFF_SLOT_LIMIT,
  staffDeploymentEffectText,
  staffRankForLevel,
} from "../data/staffDeployment.js";
import { officeEvents, realEventIds } from "../data/events.js";
import { prestigeUpgrades, medalUpgrades } from "../data/prestige.js";
import { agencyDef, ON_AIR_MULT, AGENCY_EVENT_CHANCE } from "../data/agencies.js";
import { questDefinitions } from "../data/quests.js";
import { achievementDefinitions } from "../data/achievements.js";
import { iconHtml, iconStyle, applyIcon, facilityIcon, staffIcon, tabIcon } from "./icon.js";
import { dailyQuestDefinitions } from "../data/dailyQuests.js";
import { govTitles, gachaTitles, titleById, RARITY_LABEL, RARITY_COLOR } from "../data/titles.js";
import { cosmetics, cosmeticById, COSMETIC_SLOTS } from "../data/cosmetics.js";
import { SEASON_POINTS } from "../data/seasons.js";
import { characters } from "../data/characters.js";
import { cloudEnabled } from "../firebaseConfig.js";
import { roomStageFor, nextRoomStageArea, roomStageLabel, ROOM_STAGE_COUNT } from "../world/iso.js";

const rewardLabel = (r) => [
  r.votes ? `표 +${shortNumber(r.votes)}` : null,
  r.explain ? `해명 +${shortNumber(r.explain)}` : null,
  r.trust ? `믿음 +${r.trust}` : null,
].filter(Boolean).join(" · ");

const TABS = [
  ["facilities", "시설"],
  ["crew", "직원"],
  ["events", "사건"],
  ["goals", "목표"],
  ["prestige", "감사"],
];

const hex = (c) => "#" + Number(c).toString(16).padStart(6, "0");
const PANEL_REFRESH_BUDGET_MS = 100;

// 하단 시트: peek(한 줄 요약) / full(HUD 아래까지 꽉 채운 메뉴 화면). 메뉴(탭·요약 줄)는 항상 full 로 열고 X 로 닫는다.
// half(패널 일부)는 월드의 시설·직원을 눌렀을 때만 쓴다 — 방금 누른 대상이 가려지지 않게.
const SHEET_STATES = ["peek", "half", "full"];
const SHEET_STORE_KEY = "gp-sheet-v1";

const nowMs = () => globalThis.performance?.now?.() ?? Date.now();

export class DOMBottomPanel {
  constructor(gameState) {
    this.gameState = gameState;
    this.currentEvent = null;
    this.buyQty = 1; // 일괄구매 수량: 1 | 10 | "max" (시설/직원 공유)
    this.root = document.createElement("div");
    this.root.className = "gp-bottom";
    this.root.innerHTML = `<div class="gp-handle" data-k="handle"><button class="gp-handle__chev" data-k="chev" aria-label="펼치기"></button></div><div class="gp-peek" data-k="peek"></div><div class="gp-panel" data-k="panel"></div><div class="gp-tabs" data-k="tabs"></div>`;
    this._sheet = this._loadSheet();

    const tabsEl = this.root.querySelector('[data-k="tabs"]');
    TABS.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.className = "gp-tab";
      b.dataset.tab = id;
      b.innerHTML = `<span class="gp-tab__ic" data-tabic="${id}" style="${iconStyle(tabIcon(id), 34)}"></span>${label}<span class="gp-tab__dot" data-dot="${id}" hidden></span>`;
      b.addEventListener("click", () => this._onTabClick(id));
      tabsEl.appendChild(b);
    });

    this.panel = this.root.querySelector('[data-k="panel"]');
    this.panel.addEventListener("click", (e) => this._onClick(e));
    this.peek = this.root.querySelector('[data-k="peek"]');
    this.peek.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) { this._onClick(e); return; }
      this._setSheet("full");
    });
    this.root.querySelector('[data-k="chev"]').addEventListener("click", (e) => { e.stopPropagation(); this._toggleSheet(); });
    this._bindDrag(this.root.querySelector('[data-k="handle"]'));
    this._bindDrag(this.peek);
    this._applySheetClass();
    this._lastChangedAt = -Infinity;
    this._lastRenderAt = -Infinity;
    this._refreshTimer = null;
    this._refreshFrame = null;
    this._refreshPending = false;
    this._economyOnly = true; // 보류 중인 변경이 전부 매초 숫자 변경(economy)인지
    this._refresh = (payload) => this._scheduleRefresh(payload);
    this._onVisibility = () => {
      if (document.visibilityState === "visible" && this._refreshPending) this.refresh();
    };
  }

  mount(parent) {
    // FIX #7: world scene ambient depth — scanlines + bottom vignette at zero asset cost
    this._scanlines = document.createElement("div");
    this._scanlines.className = "gp-world-scanlines";
    parent.appendChild(this._scanlines);

    this._vignette = document.createElement("div");
    this._vignette.className = "gp-world-vignette gp-world-vignette--bottom";
    parent.appendChild(this._vignette);

    parent.appendChild(this.root);
    this.gameState.on("changed", this._refresh);
    document.addEventListener("visibilitychange", this._onVisibility);
    this.refresh();

    // 패널 실높이를 게임좌표로 환산해 브로드캐스트 — 월드 카메라가 따라 올라가
    // 어떤 탭/기기에서도 국장·시설·초당표가 패널에 잘리지 않게 한다(BUG2).
    this._panelParent = parent;
    this._applySheetClass();
    this._ro = new ResizeObserver(() => this._emitSheetTop());
    this._ro.observe(this.root);
    this._roParent = new ResizeObserver(() => this._measureSheet());
    this._roParent.observe(parent);
    this._measureSheet();
    this._emitSheetTop();
    this._onSheetCollapse = () => this._stepSheet(-1);
    document.addEventListener("gp:sheet-collapse", this._onSheetCollapse);
    // 월드 오브젝트 탭 → 해당 탭을 반펼침으로(이미 펼쳐져 있으면 유지)
    this._onSheetOpen = (e) => {
      const tab = e.detail?.tab;
      if (tab && tab !== this._activeTab() && !this.gameState.tabLocked?.(tab)) this.gameState.setTab(tab);
      if (this._sheet.state === "peek") this._setSheet("half");
      else this.refresh();
    };
    document.addEventListener("gp:sheet-open", this._onSheetOpen);
    // WorldView가 늦게 준비되면(씬 로드 후) 재브로드캐스트 — 초기 이벤트 유실 방지
    this._onWorldReady = () => this._emitSheetTop();
    document.addEventListener("gp:world-ready", this._onWorldReady);
  }

  _emitSheetTop() {
    try {
      const ui = this._panelParent.getBoundingClientRect();
      if (!ui.height) return;
      const t = this.root.getBoundingClientRect().top;
      const topGame = (t - ui.top) * (844 / ui.height); // FIT 스케일 대응
      // FAB(러시/브리핑) 동적 앵커용 — 패널 실높이를 CSS 변수로 기록
      const k = ui.height / (this._panelParent.offsetHeight || ui.height); // UI 레이어 배율(데스크톱·태블릿)
      this._panelParent.style.setProperty("--panel-h", `${Math.round((ui.bottom - t) / k)}px`);
      this.gameState.uiSheetTopGame = topGame; // 늦게 생성되는 WorldView가 초기값을 읽어가도록 기록
      this.gameState.uiSheetState = this._sheet.state;
      document.dispatchEvent(new CustomEvent("gp:sheet-top", { detail: { topGame, state: this._sheet.state } }));
    } catch {}
  }

  destroy() {
    this._cancelScheduledRefresh();
    this._ro?.disconnect();
    this._roParent?.disconnect();
    document.removeEventListener("gp:sheet-collapse", this._onSheetCollapse);
    document.removeEventListener("gp:sheet-open", this._onSheetOpen);
    document.removeEventListener("gp:world-ready", this._onWorldReady);
    document.removeEventListener("visibilitychange", this._onVisibility);
    this.gameState.off("changed", this._refresh);
    // Clean up world overlays injected in mount() to avoid orphaned DOM on prestige reset
    this._scanlines?.remove();
    this._vignette?.remove();
    this.root.remove();
  }

  _cancelScheduledRefresh() {
    if (this._refreshTimer !== null) clearTimeout(this._refreshTimer);
    if (this._refreshFrame !== null) cancelAnimationFrame(this._refreshFrame);
    this._refreshTimer = null;
    this._refreshFrame = null;
    this._refreshPending = false;
  }

  // 연타의 첫 상태 변경은 즉시 보여주고, 이어지는 변경만 100ms 창으로 합친다.
  // 패널 버튼이 직접 refresh()를 호출하면 예약 렌더를 취소해 이중 갱신을 막는다.
  _scheduleRefresh(payload) {
    const now = nowMs();
    const idle = now - this._lastChangedAt >= PANEL_REFRESH_BUDGET_MS;
    this._lastChangedAt = now;
    if (!payload?.economy) this._economyOnly = false;
    if (idle) {
      this._cancelScheduledRefresh();
      this._renderNow(this._economyOnly);
      this._economyOnly = true;
      return;
    }
    if (this._refreshPending) return;

    const remaining = Math.max(0, PANEL_REFRESH_BUDGET_MS - (now - this._lastRenderAt));
    this._refreshPending = true;
    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = null;
      if (document.visibilityState !== "visible") return;
      this._refreshFrame = requestAnimationFrame(() => {
        this._refreshFrame = null;
        this._refreshPending = false;
        this._renderNow(this._economyOnly);
        this._economyOnly = true;
      });
    }, remaining);
  }

  _onClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const gs = this.gameState;
    const id = el.dataset.id;
    switch (el.dataset.action) {
      case "selectFac": gs.select(id); break;
      case "upgradeFac": gs.bulkUpgrade(gs.data.selected, this.buyQty); break;
      case "advanceStage":
        if (gs.bossRequired?.()) gs.startBoss();
        else gs.advanceStage();
        break;
      case "hire": gs.bulkHire(id, this.buyQty); break;
      case "deployStaff": gs.deployStaff(id); this.refresh(); break;
      case "undeployStaff": gs.undeployStaff(id); this.refresh(); break;
      case "setBuyQty": this.buyQty = (id === "max" ? "max" : Number(id)); this.refresh(); break;
      case "getEvent": if (gs.eventReady()) { this.currentEvent = this._pickEvent(); gs.uiEventOpen = true; if (this._sheet.state === "peek") this._setSheet("full"); this.refresh(); } break;
      case "expandSheet": this._setSheet("full"); break;
      case "eventChoice": {
        const ev = this.currentEvent?.id === id ? this.currentEvent : null;
        const result = gs.resolveEventChoice?.(ev, el.dataset.side);
        if (result) document.dispatchEvent(new CustomEvent("gp:event-resolved", { detail: result }));
        this.currentEvent = null;
        gs.uiEventOpen = false;
        this.refresh();
        break;
      }
      case "drawGacha": {
        const res = gs.drawGacha();
        if (res) document.dispatchEvent(new CustomEvent("gp:gacha-result", { detail: res }));
        this.refresh();
        break;
      }
      case "drawGacha10": {
        const list = gs.drawGacha10 ? gs.drawGacha10() : [];
        if (list.length) document.dispatchEvent(new CustomEvent("gp:gacha-result10", { detail: list }));
        this.refresh();
        break;
      }
      case "equipCos": gs.equipCosmetic(id); this.refresh(); break;
      case "selectChar": gs.selectCharacter(id); this.refresh(); break;
      case "openRank": document.dispatchEvent(new CustomEvent("gp:open-leaderboard")); break;
      case "buyPrestige": gs.buyPrestigeUpgrade(id); break;
      case "prestigeReset": document.dispatchEvent(new CustomEvent("gp:prestige-confirm")); break;
      case "claimDaily": gs.claimDailyQuest(id); this.refresh(); break;
      case "claimAttendance": gs.claimDaily(); this.refresh(); break;
      case "claimWeekly": gs.claimWeekly(); this.refresh(); break;
    }
  }

  _pickEvent() {
    return this.gameState.pickNextEvent?.() || null;
  }

  refresh() {
    this._cancelScheduledRefresh();
    this._lastChangedAt = -Infinity;
    this._economyOnly = true;
    this._renderNow(false);
  }

  // economyOnly=true면(매초 틱) 같은 탭이 이미 그려져 있을 때 숫자·버튼 상태만 패치하고 innerHTML을 건드리지 않는다.
  _renderNow(economyOnly = false) {
    this._lastRenderAt = nowMs();
    const tab = this.gameState.data.activeTab || "facilities";
    if (economyOnly && this._renderedTab === tab && tab !== "goals") {
      const patched = ({
        facilities: () => this._patchFacilities(),
        crew: () => this._patchCrew(),
        events: () => this._patchEvents(),
        prestige: () => true,
      }[tab] || (() => false))();
      if (patched) { this._updateBadges(tab); this._renderPeek(tab); return; }
    }
    const prevScroll = this.panel.querySelector(".gp-stafflist")?.scrollTop || 0;
    const goalsSignature = tab === "goals" ? this._goalsStructureSignature() : null;
    if (tab === "goals" && this._renderedTab === "goals" && goalsSignature === this._goalsSignature) {
      this._patchGoals();
    } else {
      ({
        facilities: () => this._renderFacilities(),
        crew: () => this._renderCrew(),
        events: () => this._renderEvents(),
        goals: () => this._renderGoals(),
        prestige: () => this._renderPrestige(),
      }[tab] || (() => this._renderFacilities()))();
      if (tab === "goals") this._goalsSignature = goalsSignature;
    }
    this._renderedTab = tab;
    const list = this.panel.querySelector(".gp-stafflist");
    if (list && prevScroll) list.scrollTop = prevScroll;
    this.root.querySelectorAll(".gp-tab").forEach((el) => {
      const on = el.dataset.tab === tab;
      el.classList.toggle("gp-tab--active", on);
      const locked = !!this.gameState.tabLocked?.(el.dataset.tab);
      el.classList.toggle("gp-tab--locked", locked);
      // aria-disabled 대신 data-locked: 버튼은 눌리되(잠금 안내 플로팅) 자동화 도구가 '비활성'으로 막지 않게
      if (locked) el.setAttribute("data-locked", "1"); else el.removeAttribute("data-locked");
      applyIcon(el.querySelector("[data-tabic]"), tabIcon(el.dataset.tab, on), 26);
    });
    this._updateBadges(tab);
    this._renderPeek(tab);
  }

  // ── 시트 상태 ──
  _activeTab() { return this.gameState.data.activeTab || "facilities"; }

  _loadSheet() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SHEET_STORE_KEY) || "null"); } catch {}
    // 저장된 상태가 없으면 접힘에서 시작해 월드가 먼저 보이게 한다
    const state = SHEET_STATES.includes(saved?.state) ? saved.state : "peek";
    return { state };
  }

  _saveSheet() {
    try { localStorage.setItem(SHEET_STORE_KEY, JSON.stringify({ state: this._sheet.state })); } catch {}
  }

  _setSheet(state) {
    if (!SHEET_STATES.includes(state)) return;
    const prev = this._sheet.state;
    this._sheet.state = state;
    this._applySheetClass();
    this._saveSheet();
    if (prev === "peek" && state !== "peek") this.refresh(); // 접힘 동안 멈춘 패널을 현재 상태로
  }

  _toggleSheet() {
    this._setSheet(this._sheet.state === "peek" ? "full" : "peek");
  }

  // 핸들 드래그·월드 빈 곳 탭: 위로 → 전체, 아래로 → 접힘
  _stepSheet(dir) {
    this._setSheet(dir > 0 ? "full" : "peek");
  }

  _applySheetClass() {
    SHEET_STATES.forEach((st) => this.root.classList.toggle(`gp-bottom--${st}`, this._sheet.state === st));
    this.root.querySelector('[data-k="chev"]')?.setAttribute("aria-label", this._sheet.state === "peek" ? "펼치기" : "닫기");
    // 전체 상태면 월드 위 플로팅 버튼(브리핑·러시)을 숨긴다 — 시트가 덮은 영역이라 누를 대상이 없다
    this._panelParent?.classList.toggle("gp-ui--sheet-full", this._sheet.state === "full");
  }

  // 다른 탭: 전체 화면으로 연다. 같은 탭: 접힘 ↔ 전체 토글.
  _onTabClick(id) {
    if (this.gameState.tabLocked?.(id)) {
      this.gameState.emit("float", { text: this.gameState.tabLockHint(id), x: 195, y: 470, color: "#ffd479" });
      return;
    }
    if (id === this._activeTab()) { this._toggleSheet(); return; }
    this.gameState.setTab(id);
    this._setSheet("full");
  }

  // 반펼침·전체 높이를 UI 레이어 실측으로 계산(FIT 스케일·기기 높이 대응). 전체는 HUD 바로 아래까지.
  _measureSheet() {
    // offset* 은 transform 배율과 무관한 CSS px — UI 레이어가 scale 돼도 변수 값이 어긋나지 않는다
    const uiH = this._panelParent?.offsetHeight;
    if (!uiH) return;
    const hud = this._panelParent.querySelector(".gp-hud");
    const hudBottom = hud ? hud.offsetTop + hud.offsetHeight : uiH * 0.16;
    const tabs = this.root.querySelector('[data-k="tabs"]')?.offsetHeight || 54;
    const chrome = 22 + tabs + 14; // 핸들 + 탭바 + 패딩
    const half = Math.round(uiH * 0.46 - chrome);
    const full = Math.round(uiH - hudBottom - chrome);
    this.root.style.setProperty("--sheet-half", `${Math.max(200, half)}px`);
    this.root.style.setProperty("--sheet-full", `${Math.max(half, full)}px`);
  }

  // 핸들·요약 줄 드래그: 40px 이상 위로 → 한 단계 펼침, 아래로 → 한 단계 접힘
  _bindDrag(el) {
    let startY = null;
    let moved = false;
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest("[data-action], [data-k=\"chev\"]")) return;
      startY = e.clientY; moved = false;
      try { el.setPointerCapture(e.pointerId); } catch {} // 손가락이 핸들 밖으로 나가도 pointerup을 받는다
    });
    el.addEventListener("pointermove", (e) => { if (startY !== null && Math.abs(e.clientY - startY) > 8) moved = true; });
    const end = (e) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      startY = null;
      if (dy <= -40) { this._stepSheet(1); this._suppressClick = true; }
      else if (dy >= 40) { this._stepSheet(-1); this._suppressClick = true; }
      else if (moved) this._suppressClick = true;
      if (this._suppressClick) setTimeout(() => { this._suppressClick = false; }, 0);
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", () => { startY = null; });
    el.addEventListener("click", (e) => { if (this._suppressClick) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }

  // ── 접힘 요약 줄: 탭별 핵심 한 줄 + 바로 쓸 버튼 하나 ──
  _renderPeek(tab) {
    if (!this.peek) return;
    const gs = this.gameState;
    let html = "";
    if (tab === "facilities") {
      const sel = gs.facility(gs.data.selected) ? gs.data.selected : "desk";
      const f = gs.facility(sel);
      const unlocked = gs.isUnlocked(sel);
      const plan = unlocked ? gs.facilityBulkPlan(sel, this.buyQty) : { levels: 0, voteCost: 0, explainCost: 0 };
      const canBuy = unlocked && plan.levels > 0 && gs.data.votes >= plan.voteCost && gs.data.explain >= plan.explainCost;
      const costStr = plan.levels > 0 ? `${shortNumber(plan.voteCost)}표` : "부족";
      const qtyTag = this.buyQty === "max" ? (plan.levels > 0 ? `+${plan.levels}Lv` : "MAX") : `×${plan.levels || this.buyQty}`;
      const sub = unlocked
        ? `▲ 초당 <b>+${rateNumber(gs.upgradeGain(sel) ?? f.cps)}표</b>${gs.intakeFor && gs.capacityFor ? ` · 유입 ${shortNumber(gs.intakeFor(gs.data))}/용량 ${shortNumber(gs.capacityFor(gs.data))}` : ""}`
        : this._lockText(sel);
      html = `<div class="gp-peek__icon" style="${iconStyle(facilityIcon(sel), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">${f.name} Lv.${gs.level(sel)}</div><div class="gp-peek__sub">${sub}</div></div>${
        unlocked
          ? `<button class="gp-btn gp-btn--gold gp-btn--upgrade ${canBuy ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="upgradeFac">업그레이드<small>${costStr}${this.buyQty !== 1 ? ` · ${qtyTag}` : ""}</small></button>`
          : `<button class="gp-btn gp-btn--upgrade gp-btn--disabled" data-action="expandSheet">잠김</button>`}`;
    } else if (tab === "crew") {
      const slots = gs.staffSlots ? gs.staffSlots() : [];
      const mult = gs.staffMultiplierFor ? gs.staffMultiplierFor(gs.data) : 1;
      const slotHtml = Array.from({ length: STAFF_SLOT_LIMIT }, (_, i) => slots[i]
        ? `<span class="gp-peek__slot"><i class="gp-ic" style="${iconStyle(staffIcon(slots[i]), 24)}"></i></span>`
        : `<span class="gp-peek__slot gp-peek__slot--empty"></span>`).join("");
      html = `<div class="gp-peek__icon" style="${iconStyle(tabIcon("crew", true), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">현장 개표팀 ${slots.length}/${STAFF_SLOT_LIMIT}</div><div class="gp-peek__sub"><b>${mult < 10 ? `+${((mult - 1) * 100).toFixed(0)}%` : `x${mult.toFixed(1)}`}</b> 생산 보너스</div></div><div class="gp-peek__slots">${slotHtml}</div>`;
    } else if (tab === "events") {
      const ev = this.currentEvent;
      if (ev) {
        html = `<div class="gp-peek__icon" style="${iconStyle(tabIcon("events", true), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">${ev.title}</div><div class="gp-peek__sub">선택 대기 중</div></div><button class="gp-btn gp-btn--sm gp-btn--gold" data-action="expandSheet">보기</button>`;
      } else {
        const ready = gs.eventReady();
        const sec = Math.ceil((gs.eventCooldownRemainingMs ? gs.eventCooldownRemainingMs() : 0) / 1000);
        const scale = gs.eventRewardScale ? gs.eventRewardScale() : 1;
        html = `<div class="gp-peek__icon" style="${iconStyle(tabIcon("events", true), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">사건 대응실</div><div class="gp-peek__sub">${ready ? `보상 <b>x${scale.toFixed(1)}</b>` : `다음 사건까지 <b data-k="evsec">${sec}</b>초`}</div></div>${
          ready ? `<button class="gp-btn gp-btn--sm gp-btn--ready" style="background:var(--event);color:#fff" data-action="getEvent">사건 받기</button>` : ""}`;
      }
    } else if (tab === "goals") {
      const st = gs.dailyStatus ? gs.dailyStatus() : null;
      const weekly = gs.weeklyClaimable ? gs.weeklyClaimable() : false;
      const q = gs.nextQuest ? gs.nextQuest() : null;
      if (st?.available) html = `<div class="gp-peek__icon" style="${iconStyle(tabIcon("goals", true), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">출석 보상 ${st.streak}일차</div><div class="gp-peek__sub">해명 +${st.reward.explain} · 표 +${shortNumber(st.reward.votes)}</div></div><button class="gp-btn gp-btn--sm gp-btn--gold gp-btn--ready" data-action="claimAttendance">받기</button>`;
      else if (weekly) html = `<div class="gp-peek__icon" style="${iconStyle(tabIcon("goals", true), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">주간 목표 달성</div></div><button class="gp-btn gp-btn--sm gp-btn--gold gp-btn--ready" data-action="claimWeekly">받기</button>`;
      else if (q) { const pr = gs.questProgress(q); html = `<div class="gp-peek__icon" style="${iconStyle(tabIcon("goals", true), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">${q.title}</div><div class="gp-peek__sub"><b>${shortNumber(Math.min(pr, q.target))}</b> / ${shortNumber(q.target)} · ${rewardLabel(q.reward)}</div></div>`; }
      else html = `<div class="gp-peek__icon" style="${iconStyle(tabIcon("goals", true), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">운영 목표</div><div class="gp-peek__sub">정규 목표 완료 · 끝없는 목표 진행 중</div></div>`;
    } else if (tab === "prestige") {
      const pj = gs.prestigeProjection ? gs.prestigeProjection() : { earned: 0 };
      const can = pj.earned > 0;
      html = `<div class="gp-peek__icon" style="${iconStyle(tabIcon("prestige", true), 36)}"></div><div class="gp-peek__body"><div class="gp-peek__title">감사 재정비</div><div class="gp-peek__sub">${can ? `인장 <b>+${shortNumber(pj.earned)}</b> · 영구 생산 +${(pj.gainPct || 0).toFixed(1)}%` : (pj.advice?.detail || "감사 조건을 달성하세요")}</div></div>${can ? `<button class="gp-btn gp-btn--sm gp-btn--gold" data-action="expandSheet">보기</button>` : ""}`;
    }
    // 같은 구조면 숫자만 패치해 눌리는 중인 버튼을 갈아끼우지 않는다
    const sig = `${tab}|${html.replace(/[\d.,]+/g, "#")}`;
    if (sig === this._peekSig && this.peek.firstElementChild) {
      const tmp = document.createElement("div"); tmp.innerHTML = html;
      const a = this.peek.querySelectorAll("*"); const b = tmp.querySelectorAll("*");
      if (a.length === b.length) {
        a.forEach((el, i) => {
          const nb = b[i];
          if (el.children.length === 0 && el.textContent !== nb.textContent) el.textContent = nb.textContent;
          if (el.className !== nb.className) el.className = nb.className;
        });
        return;
      }
    }
    this._peekSig = sig;
    this.peek.innerHTML = html;
  }

  // 탭 알림 점: 사건 대응 가능 시 사건 탭에 표시(해당 탭을 보고 있으면 숨김)
  _updateBadges(activeTab) {
    const gs = this.gameState;
    const eventDot = this.root.querySelector('[data-dot="events"]');
    if (eventDot) eventDot.hidden = !(gs.eventReady() && activeTab !== "events") || !!gs.tabLocked?.("events");
    // 목표 탭: 일일 퀘스트 수령 가능 시 알림 점
    const goalDot = this.root.querySelector('[data-dot="goals"]');
    const goalClaimable = (gs.anyDailyQuestClaimable && gs.anyDailyQuestClaimable()) || (gs.weeklyClaimable && gs.weeklyClaimable()) || (gs.dailyStatus && gs.dailyStatus().available);
    if (goalDot) goalDot.hidden = !(goalClaimable && activeTab !== "goals");
    // 살 수 있는 것이 생기면 그 탭이 켜진다(AdVenture Capitalist의 Managers 탭 점등). 보고 있는 탭은 제외.
    const ready = {
      facilities: activeTab !== "facilities" && !!gs.upgradeAffordable?.(),
      crew: activeTab !== "crew" && !!gs.anyHireAffordable?.() && !gs.tabLocked?.("crew"),
    };
    this.root.querySelectorAll(".gp-tab").forEach((el) => el.classList.toggle("gp-tab--ready", !!ready[el.dataset.tab]));
  }

  // 일괄구매 수량 토글(x1 / x10 / MAX) — 시설·직원 탭 공유
  _qtyToggle() {
    const opts = [["1", "x1"], ["10", "x10"], ["max", "MAX"]];
    return `<div class="gp-qty">${opts.map(([v, l]) =>
      `<button class="gp-qtybtn ${String(this.buyQty) === v ? "gp-qtybtn--on" : ""}" data-action="setBuyQty" data-id="${v}">${l}</button>`
    ).join("")}</div>`;
  }

  // ── 매초 부분 갱신(innerHTML 없음) ──
  _setBtnState(btn, ready) {
    if (!btn) return;
    btn.classList.toggle("gp-btn--ready", ready);
    btn.classList.toggle("gp-btn--disabled", !ready);
  }

  _patchFacilities() {
    const gs = this.gameState;
    const sel = gs.data.selected;
    const unlocked = gs.isUnlocked(sel);
    const stageDone = gs.data.stage.progress >= gs.data.stage.target;
    const sig = `${sel}|${unlocked}|${stageDone}|${gs.bossActive?.() || false}|${gs.bossRequired?.() || false}|${this.buyQty}`;
    if (sig !== this._facSignature) return false; // 구조가 바뀌면 전체 렌더
    if (unlocked) {
      const plan = gs.facilityBulkPlan(sel, this.buyQty);
      const canBuy = plan.levels > 0 && gs.data.votes >= plan.voteCost && gs.data.explain >= plan.explainCost;
      const btn = this.panel.querySelector('[data-action="upgradeFac"]');
      this._setBtnState(btn, canBuy);
      const small = btn?.querySelector("small");
      const qtyTag = this.buyQty === "max" ? (plan.levels > 0 ? `+${plan.levels}Lv` : "MAX") : `×${plan.levels || this.buyQty}`;
      const text = `${plan.levels > 0 ? `${shortNumber(plan.voteCost)}표` : "부족"}${this.buyQty !== 1 ? ` · ${qtyTag}` : ""}`;
      if (small && small.textContent !== text) small.textContent = text;
    }
    const prog = this.panel.querySelector(".gp-region__progress");
    if (prog) {
      const offlineCarry = Math.max(0, Number(gs.data.offlineCarryVotes) || 0);
      const html = `${gs.data.stage.area}구역 · ${shortNumber(gs.data.stage.progress)} / ${shortNumber(gs.data.stage.target)}${offlineCarry > 0 ? `<small class="gp-carry">미처리 개표 +${shortNumber(offlineCarry)}</small>` : ""}`;
      if (prog.innerHTML !== html) prog.innerHTML = html;
    }
    const frac = this.panel.querySelector(".gp-stage-frac");
    if (frac) {
      const text = `${Math.floor((gs.data.stage.progress / gs.data.stage.target) * 100)}%`;
      if (frac.textContent !== text) frac.textContent = text;
    }
    const cap = this.panel.querySelector(".gp-capline");
    if (cap) {
      const tmp = document.createElement("div");
      tmp.innerHTML = this._capacityLine();
      const next = tmp.firstElementChild;
      if (next && next.outerHTML !== cap.outerHTML) cap.replaceWith(next);
    }
    return true;
  }

  _patchCrew() {
    const gs = this.gameState;
    const slotsFull = gs.staffSlots().length >= STAFF_SLOT_LIMIT;
    const sig = `${this.buyQty}|${slotsFull}|${gs.staffSlots().join(",")}|${staffDefinitions.map((s) => gs.staffLevel(s.id)).join(",")}`;
    if (sig !== this._crewSignature) return false;
    for (const s of staffDefinitions) {
      const btn = this.panel.querySelector(`[data-action="hire"][data-id="${s.id}"]`);
      if (!btn) continue;
      const plan = gs.staffBulkPlan(s.id, this.buyQty);
      const can = plan.levels > 0 && gs.data.votes >= plan.voteCost && gs.data.explain >= plan.explainCost;
      this._setBtnState(btn, can);
    }
    return true;
  }

  _patchEvents() {
    const gs = this.gameState;
    if (this.currentEvent) return true; // 사건 카드가 떠 있으면 매초 바뀌는 숫자가 없다
    const ready = gs.eventReady();
    if (ready !== this._eventsReadyRendered) return false; // 준비 상태 전환은 전체 렌더
    if (!ready) {
      const btn = this.panel.querySelector(".gp-btn--event");
      const sec = Math.ceil((gs.eventCooldownRemainingMs ? gs.eventCooldownRemainingMs() : 0) / 1000);
      const text = `다음 사건까지 ${sec}초`;
      if (btn && btn.textContent !== text) btn.textContent = text;
    }
    return true;
  }

  _renderFacilities() {
    const gs = this.gameState;
    const sel = gs.facility(gs.data.selected) ? gs.data.selected : "desk";
    const f = gs.facility(sel);
    const unlocked = gs.isUnlocked(sel);
    const cost = gs.cost(sel);
    const ex = gs.explainCost(sel);
    const stageDone = gs.data.stage.progress >= gs.data.stage.target;
    const offlineCarry = Math.max(0, Number(gs.data.offlineCarryVotes) || 0);
    const bossActive = gs.bossActive?.() || false;
    const bossRequired = gs.bossRequired?.() || false;
    this._facSignature = `${sel}|${unlocked}|${stageDone}|${bossActive}|${bossRequired}|${this.buyQty}`;
    const stageAction = bossActive
      ? `<button class="gp-btn gp-btn--sm gp-btn--disabled" aria-disabled="true">검증 진행 중</button>`
      : bossRequired
        ? `<button class="gp-btn gp-btn--sm gp-btn--gold gp-btn--boss" data-action="advanceStage">최종 검증!</button>`
        : `<button class="gp-btn gp-btn--sm" data-action="advanceStage">지역완료 ✓</button>`;
    // 일괄구매 플랜(현재 수량 기준)
    const plan = unlocked ? gs.facilityBulkPlan(sel, this.buyQty) : { levels: 0, voteCost: 0, explainCost: 0 };
    const canBuy = unlocked && plan.levels > 0 && gs.data.votes >= plan.voteCost && gs.data.explain >= plan.explainCost;
    const qtyTag = this.buyQty === "max" ? (plan.levels > 0 ? `+${plan.levels}Lv` : "MAX") : `×${plan.levels || this.buyQty}`;
    const costStr = plan.levels > 0 ? `${shortNumber(plan.voteCost)}표` : "부족";
    // FIX #4: two-line upgrade button — verb on top, cost below — prevents truncation at any number length
    const upgradeBtn = unlocked
      ? `<button class="gp-btn gp-btn--gold gp-btn--upgrade ${canBuy ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="upgradeFac">업그레이드<small>${costStr}${this.buyQty !== 1 ? ` · ${qtyTag}` : ""}</small></button>`
      : `<button class="gp-btn gp-btn--upgrade gp-btn--disabled" data-action="upgradeFac">잠김</button>`;
    // 로드맵 #6: 다음 레벨 비용을 되찾는 시간 — '지금 사면 몇 분 뒤 본전'을 바로 보여준다
    const payback = unlocked ? gs.upgradePaybackSeconds(sel) : null;
    const paybackText = payback === null ? "" : `<div class="gp-card__gain gp-card__payback">⏱ 비용 회수 ${formatDuration(payback)}</div>`;
    this.panel.innerHTML = `
      <div class="gp-card">
        <div class="gp-card__icon" style="${iconStyle(facilityIcon(sel), 64)}"></div>
        <div class="gp-card__body">
          <div class="gp-card__title">${f.name} Lv.${gs.level(sel)}</div>
          <div class="gp-card__sub">${unlocked ? `${shortNumber(cost)}표 · 해명 ${shortNumber(ex)}` : this._lockText(sel)}</div>
          ${unlocked ? `<div class="gp-card__gain">▲ 업그레이드 시 초당 +${rateNumber(gs.upgradeGain(sel) ?? f.cps)}표</div>${paybackText}` : ""}
          ${unlocked && gs.nextFacilityMilestone(gs.level(sel), sel) != null
            ? `<div class="gp-card__milestone">★ Lv.${gs.nextFacilityMilestone(gs.level(sel), sel)} 달성 시 생산 ×2</div>`
            : ""}
        </div>
        ${upgradeBtn}
      </div>
      ${unlocked ? this._qtyToggle() : ""}
      ${this._capacityLine()}
      <div class="gp-facsel">${facilities.map((ff) => {
        const choked = gs.intakeFor && gs.capacityFor ? gs.intakeFor(gs.data) > gs.capacityFor(gs.data) * 1.0001 : false;
        const u = gs.isUnlocked(ff.id);
        // P1 fix: facility picker icon — use webp asset as background-image, color as fallback
      const needCap = choked && u && (ff.capacity ?? 1) >= 1;
      return `<button class="gp-fac ${ff.id === sel ? "gp-fac--active" : ""} ${u ? "" : "gp-fac--locked"}${needCap ? " gp-fac--need" : ""}" data-action="selectFac" data-id="${ff.id}"><span class="gp-fac__icon" style="${iconStyle(facilityIcon(ff.id), 40)}"></span><span class="gp-fac__role">${ff.role}</span><span class="gp-fac__lv">${u || gs.level(ff.id) > 0 ? `Lv.${gs.level(ff.id)}` : (gs.unlockReason(ff.id)?.area ? `${ff.unlock}구` : "잠김")}</span></button>`;
      }).join("")}</div>
      <div class="gp-region"><span class="gp-region__progress">${gs.data.stage.area}구역 · ${shortNumber(gs.data.stage.progress)} / ${shortNumber(gs.data.stage.target)}${offlineCarry > 0 ? `<small class="gp-carry">미처리 개표 +${shortNumber(offlineCarry)}</small>` : ""}</span>${
        stageDone
          ? stageAction
          : `<span class="gp-stage-frac">${Math.floor((gs.data.stage.progress / gs.data.stage.target) * 100)}%</span>`
      }</div>
      ${this._nextUnlockTeaser()}`;
  }

  // 잠금 사유 문구: 구역 또는 선행 시설 레벨
  _lockText(id) {
    const r = this.gameState.unlockReason ? this.gameState.unlockReason(id) : null;
    if (!r) return "";
    if (r.area) return `${r.area}구역에서 해금`;
    const fac = this.gameState.facility(r.facility);
    return `${fac?.name || r.facility} Lv.${r.level} 필요`;
  }

  // 처리 용량 라인: 유입 vs 용량, 적체. 병목이면 경고색.
  _capacityLine() {
    const gs = this.gameState;
    if (!gs.intakeFor || !gs.capacityFor) return "";
    const intake = gs.intakeFor(gs.data);
    const capacity = gs.capacityFor(gs.data);
    const backlog = Math.max(0, gs.data.backlog || 0);
    const choked = intake > capacity * 1.0001;
    const fmt = (v) => (v < 1000 ? v.toFixed(1) : shortNumber(v));
    return `<div class="gp-capline${choked ? " gp-capline--choked" : ""}" title="유입이 용량을 넘으면 적체가 쌓여 믿음이 떨어집니다. 분류·기록·전산과 운반·전산 직원이 용량을 올립니다.">
      <span>유입 <b>${fmt(intake)}</b>/초</span><span>용량 <b>${fmt(capacity)}</b>/초</span><span>${backlog > 0 ? `적체 <b>${shortNumber(backlog)}</b>` : "적체 없음"}</span>${choked ? `<em>병목 · 분류·기록 증설</em>` : ""}
    </div>`;
  }

  // 완성에 가장 가까운 도감 세트 한 줄(중기 #6)
  _dexSetLine() {
    const n = this.gameState.nextDexSet ? this.gameState.nextDexSet() : null;
    if (!n) return `<div class="gp-dexset">도감 세트 전부 완성</div>`;
    return `<div class="gp-dexset"><b>${n.set.name}</b> ${n.got}/${n.total} · 완성 시 ${n.set.effectText}</div>`;
  }

  // 다음 해금 티저: 아직 잠긴 시설 중 가장 먼저 열리는 것을 한 줄 안내(진행 동기 부여)
  // FIX P1: emoji 🔒 replaced with CSS-safe unicode square to avoid Android WebView glyph fallback failure
  _nextUnlockTeaser() {
    const gs = this.gameState;
    const locked = gs.lockedFacilities ? gs.lockedFacilities() : [];
    const area = gs.data.stage.area;
    const st = roomStageFor(area);
    const nextArea = nextRoomStageArea(area);
    const room = `개표소 ${roomStageLabel(st)} (${st + 1}/${ROOM_STAGE_COUNT})${nextArea ? ` · <b>${nextArea}구역</b>에서 ${roomStageLabel(st + 1)} 확장` : ""}`;
    if (!locked.length) return `<div class="gp-nextunlock">${room}</div>`;
    const next = locked.reduce((a, b) => ((b.unlock || 1) < (a.unlock || 1) ? b : a));
    return `<div class="gp-nextunlock"><span style="font-size:9px;color:var(--ink-soft);vertical-align:middle">&#9632;</span> 다음 해금: <b>${next.name}</b> · ${this._lockText(next.id)}<br>${room}</div>`;
  }

  _renderCrew() {
    const gs = this.gameState;
    this._crewSignature = `${this.buyQty}|${gs.staffSlots().length >= STAFF_SLOT_LIMIT}|${gs.staffSlots().join(",")}|${staffDefinitions.map((s) => gs.staffLevel(s.id)).join(",")}`;
    // P2 fix: detect light-luminance rarity colors for badge contrast swap
    const isLightColor = (hex6) => {
      const r = (hex6 >> 16) & 0xff, g = (hex6 >> 8) & 0xff, b = hex6 & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) > 153; // > 60% luminance
    };
    const cards = staffDefinitions.map((s) => {
      const lv = gs.staffLevel(s.id);
      const rank = staffRankForLevel(lv);
      const deployed = gs.staffDeployed(s.id);
      const plan = gs.staffBulkPlan(s.id, this.buyQty);
      const can = plan.levels > 0 && gs.data.votes >= plan.voteCost && gs.data.explain >= plan.explainCost;
      const block = plan.levels > 0 ? null : (gs.hireBlockReason ? gs.hireBlockReason(s.id) : null);
      const blockFac = block?.facility ? gs.facility(block.facility) : null;
      const blockLabel = block?.max ? "최대" : blockFac ? `${blockFac.role} Lv.${block.level}` : "최대";
      const skill = s.skill ? (gs.staffSkillActive(s.id) ? s.skill.name : `스킬 Lv.${s.skill.unlockLevel}`) : "";
      // 시너지: 대응 시설과 곱연산 — 빌드 방향 표시(활성 시 강조)
      const synFac = s.synergy ? facilities.find((f) => f.id === s.synergy.facility) : null;
      const synActive = synFac && lv > 0 && gs.level(synFac.id) > 0;
      const synLabel = synFac ? `<span class="gp-staff__syn${synActive ? " gp-staff__syn--on" : ""}">◈ ${synFac.name} 시너지</span>` : "";
      const rarityHex = rarityColors[s.rarity] || 0xd8c4a0;
      const lightRarity = isLightColor(rarityHex) ? " gp-staff--light-rarity" : "";
      const slotsFull = gs.staffSlots().length >= STAFF_SLOT_LIMIT;
      const deployButton = lv <= 0
        ? `<span class="gp-staff__deploy gp-staff__deploy--locked">채용 후 배치</span>`
        : deployed
          ? `<button class="gp-staff__deploy gp-staff__deploy--on" data-action="undeployStaff" data-id="${s.id}">현장 근무 · 대기 전환</button>`
          : `<button class="gp-staff__deploy${slotsFull ? " gp-staff__deploy--locked" : ""}" ${slotsFull ? "disabled aria-disabled=\"true\"" : `data-action="deployStaff" data-id="${s.id}"`}>${slotsFull ? "빈 슬롯 필요" : "현장에 배치"}</button>`;
      const nextRank = [5, 10, 15, 20].find((level) => level > lv);
      // P0 fix: show 해명 cost in hire button (two-line pattern); add gp-btn--ready glow when affordable
      return `<div class="gp-staff${lightRarity}${deployed ? " gp-staff--deployed" : ""}" style="--rarity-color:${hex(rarityHex)}">
        <div class="gp-staff__dot gp-staff__dot--r${rank.tier}"><i class="gp-ic" style="${iconStyle(staffIcon(s.id), 36)}"></i><span>${rank.tier || ""}</span></div>
        <div class="gp-staff__body"><div class="gp-staff__name">${s.name}<span class="gp-staff__rar">${s.rarityName}</span></div><div class="gp-staff__sub">Lv.${lv} · ${rank.name}${nextRank ? ` · Lv.${nextRank} 승급` : " · 최고 직급"}</div><div class="gp-staff__sub">${skill} ${synLabel}</div></div>
        <button class="gp-btn gp-btn--sm gp-btn--upgrade ${can ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="hire" data-id="${s.id}">${plan.levels > 0 ? `${shortNumber(plan.voteCost)}표` : blockLabel}<small>${this.buyQty !== 1 ? (this.buyQty === "max" ? (plan.levels > 0 ? `MAX +${plan.levels}` : "MAX") : `×${plan.levels || this.buyQty}`) : (plan.levels > 0 ? `${shortNumber(plan.explainCost)}해명` : (blockFac ? "시설 필요" : `Lv.${lv}`))}</small></button>
        <div class="gp-staff__field"><span>${staffDeploymentEffectText(s.id, lv)}</span>${deployButton}</div></div>`;
    }).join("");
    // FIX P2: multiplier shown as "+69% 생산 보너스" sub-label (not "x1.69" debug-looking number in title)
    const mult = gs.staffMultiplierFor(gs.data);
    const multLabel = mult < 10
      ? `<span class="gp-card__gain">+${((mult - 1) * 100).toFixed(0)}% 생산 보너스</span>`
      : `<span class="gp-card__gain">x${mult.toFixed(1)} 생산</span>`;
    const deployedSlots = gs.staffSlots();
    const slotCards = Array.from({ length: STAFF_SLOT_LIMIT }, (_, index) => {
      const id = deployedSlots[index];
      if (!id) return `<div class="gp-fieldslot gp-fieldslot--empty"><span>${index + 1}</span><b>빈 자리</b></div>`;
      const staff = staffDefinitions.find((item) => item.id === id);
      const rank = staffRankForLevel(gs.staffLevel(id));
      return `<button class="gp-fieldslot gp-fieldslot--filled" data-action="undeployStaff" data-id="${id}" aria-label="${staff.role} ${rank.name} 현장 해제 · 대기 전환" style="--staff-color:${hex(staff.color)}"><span>${index + 1}</span><b>${staff.role} · ${rank.name}</b><small>${staffDeploymentEffectText(id, gs.staffLevel(id))}</small></button>`;
    }).join("");
    // Scroll fade is a real div (not ::after) for reliable WebView support
    this.panel.innerHTML = `<div class="gp-paneltitle gp-paneltitle--row gp-paneltitle--crew"><span class="gp-crewtitle">현장 개표팀 <span class="gp-fieldcount">${deployedSlots.length}/${STAFF_SLOT_LIMIT}</span></span>${multLabel}${this._qtyToggle()}</div><div class="gp-fieldslots">${slotCards}</div><div class="gp-stafflist-wrap"><div class="gp-stafflist">${cards}</div><div class="gp-stafflist-fade" aria-hidden="true"></div></div>`;
  }

  _renderEvents() {
    const gs = this.gameState;
    const ev = this.currentEvent;
    if (ev) {
      const real = realEventIds.has(ev.id);
      const realBadge = real ? `<div class="gp-event__real">영감받은 각색</div>` : "";
      const chainBadge = ev.chainId
        ? `<div class="gp-event__chainbadge">연쇄 사건 · ${ev.chainStep + 1}/${ev.chainStepCount}<b>${ev.chainTitle}</b></div>`
        : "";
      const agency = ev.agency ? agencyDef(ev.agency) : null;
      const agencyBadge = agency ? `<div class="gp-event__agency" style="--ag:${agency.color}">${agency.name}</div>` : "";
      // 선택 결과 수치 미리보기 — 신규 유저도 결과 예측 가능(사이다 예고 포함)
      const fx = (eff) => {
        const scale = gs.eventRewardScale ? gs.eventRewardScale() : 1;
        const parts = [];
        if (eff.votes) parts.push(`<i class="${eff.votes > 0 ? "gp-fx--up" : "gp-fx--dn"}">표 ${eff.votes > 0 ? "+" : ""}${shortNumber(Math.round(eff.votes > 0 ? eff.votes * scale : eff.votes))}</i>`);
        if (eff.explain) parts.push(`<i class="${eff.explain > 0 ? "gp-fx--up" : "gp-fx--dn"}">해명 ${eff.explain > 0 ? "+" : ""}${shortNumber(Math.round(eff.explain > 0 ? eff.explain * scale : eff.explain))}</i>`);
        if (eff.trust) {
          const trust = gs.eventTrustEffect ? gs.eventTrustEffect(eff.trust) : eff.trust;
          const shown = Number.isInteger(trust) ? trust : trust.toFixed(1);
          parts.push(`<i class="${trust > 0 ? "gp-fx--up" : "gp-fx--dn"}">믿음 ${trust > 0 ? "+" : ""}${shown}</i>`);
        }
        if ((eff.trust || 0) >= 12) parts.push(`<i class="gp-fx--cider">사이다!</i>`);
        if (eff.seals) parts.push(`<i class="gp-fx--agency">인장 +${eff.seals}</i>`);
        if (eff.onAir) parts.push(`<i class="gp-fx--agency">생중계 ${eff.onAir}초 ×${ON_AIR_MULT}</i>`);
        if (eff.cert) parts.push(`<i class="gp-fx--agency">인증 +${eff.cert}</i>`);
        return `<span class="gp-event__fx">${parts.join("")}</span>`;
      };
      this.panel.innerHTML = `<div class="gp-event${real ? " gp-event--real" : ""}${ev.chainId ? " gp-event--chain" : ""}${agency ? " gp-event--agency" : ""}"${agency ? ` style="--ag:${agency.color}"` : ""}>${realBadge}${chainBadge}${agencyBadge}<div class="gp-event__title">${ev.title}</div><div class="gp-event__body">${ev.body}</div>
        <div class="gp-event__choices">
          <button class="gp-btn gp-event__c" data-action="eventChoice" data-id="${ev.id}" data-side="left">${ev.left[0]}<small>${ev.left[2]}</small>${fx(ev.left[1])}</button>
          <button class="gp-btn gp-event__c" data-action="eventChoice" data-id="${ev.id}" data-side="right">${ev.right[0]}<small>${ev.right[2]}</small>${fx(ev.right[1])}</button>
        </div></div>`;
    } else {
      const log = (gs.data.log || []).slice(0, 3).map((l) => `<div class="gp-logline">${l}</div>`).join("");
      const ready = gs.eventReady();
      this._eventsReadyRendered = ready;
      const chainStatus = gs.eventChainStatus?.();
      const remainMs = gs.eventCooldownRemainingMs ? gs.eventCooldownRemainingMs() : 0;
      const totalMs = gs.eventCooldownTotalMs ? gs.eventCooldownTotalMs() : remainMs;
      const sec = Math.ceil(remainMs / 1000);
      const readyLabel = chainStatus?.active
        ? `후속 사건 ${chainStatus.nextStep}/${chainStatus.totalSteps} 받기`
        : "사건 받기";
      const btn = ready
        ? `<button class="gp-btn gp-btn--event${chainStatus?.active ? " gp-btn--chain" : ""}" data-action="getEvent">${readyLabel}</button>`
        : `<button class="gp-btn gp-btn--event gp-btn--disabled" data-action="getEvent">다음 사건까지 ${sec}초</button>`;
      // 사건 도감 진척을 사건 탭에 노출 — 수집 동기를 사건 발생 지점에 배치
      const dexN = gs.seenEventCount();
      const dexTotal = officeEvents.length;
      const nextM = gs.nextDexMilestone();
      const dexPct = Math.round(gs.dexBonusPct() * 100);
      const dexLine = nextM
        ? `도감 ${dexN}/${dexTotal} · 생산 +${dexPct}% · ${nextM.n}종에서 +${Math.round(nextM.pct * 100)}%`
        : `도감 ${dexN}/${dexTotal} 완성! · 생산 +${dexPct}% 영구`;
      const chainLine = chainStatus?.active
        ? `<div class="gp-chainline gp-chainline--active"><b>${chainStatus.chain.title}</b><span>다음은 ${chainStatus.nextStep}/${chainStatus.totalSteps}편 · 후속 사건 보장</span></div>`
        : `<div class="gp-chainline"><b>사건 결말 ${chainStatus?.discovered || 0}/${chainStatus?.totalEndings || 0}</b><span>이번 런 완료 ${chainStatus?.completedThisRun || 0}건</span></div>`;
      const effectLine = chainStatus?.effects?.length
        ? `<div class="gp-chainfx"><b>이번 런 효과</b>${chainStatus.effects.map((ending) => `<span>${ending.title} · ${ending.effectText.replace("이번 런 ", "")}</span>`).join("")}</div>`
        : "";
      this.panel.innerHTML = `<div class="gp-paneltitle">${iconHtml("ui-clipboard", { size: 32 })}사건 대응실 · 처리 ${gs.data.stats.totalEvents}건</div><div class="gp-card__sub">보상 x${gs.eventRewardScale().toFixed(1)}</div>${btn}${chainLine}${effectLine}${this._agencyLine()}<div class="gp-dexline">${dexLine}</div>${this._dexSetLine()}<div class="gp-log">${log}</div>`;
      // transform 기반 쿨다운 스윕으로 레이아웃 재계산을 피한다.
      if (!ready && totalMs > 0) {
        const btnEl = this.panel.querySelector(".gp-btn--event");
        if (btnEl) {
          const ratio = Math.max(0, Math.min(1, 1 - remainMs / totalMs));
          btnEl.style.setProperty("--cd-ratio", ratio);
        }
      }
    }
  }

  _renderGoals() {
    const gs = this.gameState;
    // 출석 보상 회수 행 — 모달을 실수로 닫아도 여기서 받기(스트릭 파손 방지)
    let dailyRow = "";
    if (gs.dailyStatus) {
      const st = gs.dailyStatus();
      if (st.available) {
        dailyRow = `<div class="gp-goal gp-goal--active"><div class="gp-goal__head"><span class="gp-goal__title">출석 보상 ${st.streak}일차</span><button class="gp-btn gp-btn--sm gp-btn--gold" data-action="claimAttendance">받기</button></div><div class="gp-goal__desc">해명 +${st.reward.explain} · 표 +${shortNumber(st.reward.votes)}${st.reward.seals ? " · 인장 +1" : ""}</div></div>`;
      }
    }
    const active = gs.nextQuest();
    const doneCount = questDefinitions.filter((q) => gs.data.quests[q.id]).length;
    const seasonCard = this._renderSeasonCard();

    const goalRow = (q, state) => {
      // state: "done" | "active" | "locked"
      const p = gs.questProgress(q);
      const ratio = Math.max(0, Math.min(1, p / q.target));
      const cls = state === "done" ? "gp-goal--done" : state === "active" ? "gp-goal--active" : "gp-goal--locked";
      const badge = state === "done" ? "✓" : state === "active" ? "진행" : "예정";
      return `<div class="gp-goal ${cls}" data-goal-kind="quest" data-goal-id="${q.id}">
        <div class="gp-goal__head"><span class="gp-goal__title">${q.title}</span><span class="gp-goal__badge">${badge}</span></div>
        <div class="gp-goal__desc">${q.desc}</div>
        <div class="gp-progress gp-goal__bar"><div class="gp-progress__fill" style="transform:scaleX(${state === "done" ? 1 : ratio})"></div></div>
        <div class="gp-goal__foot"><span>${shortNumber(Math.min(p, q.target))} / ${shortNumber(q.target)}</span><span class="gp-goal__reward">${rewardLabel(q.reward)}</span></div>
      </div>`;
    };

    // 한정 시즌(주간) 목표 — 카운트다운 + 1회 보상
    const wDef = gs.weeklyDef ? gs.weeklyDef() : null;
    let weeklyRow = "";
    if (wDef) {
      const wp = gs.weeklyProgress();
      const wt = gs.weeklyTarget();
      const wdone = gs.weeklyDone();
      const wclaimed = gs.weeklyClaimed();
      const wclaimable = gs.weeklyClaimable();
      const wratio = Math.max(0, Math.min(1, wp / wt));
      const wright = wclaimed
        ? `<span class="gp-goal__badge">완료</span>`
        : wclaimable
          ? `<button class="gp-btn gp-btn--sm gp-btn--ready" data-action="claimWeekly">받기</button>`
          : `<span class="gp-goal__badge gp-goal__badge--week">D-${gs.weeklyDaysLeft()}</span>`;
      weeklyRow = `<div class="gp-goal gp-goal--weekly ${wclaimed ? "gp-goal--done" : wclaimable ? "gp-goal--active" : ""}" data-goal-kind="weekly">
        <div class="gp-goal__head"><span class="gp-goal__title">&#9733; ${wDef.title}</span>${wright}</div>
        <div class="gp-goal__desc">이번 주 표 ${shortNumber(wt)}장 처리</div>
        <div class="gp-progress gp-goal__bar"><div class="gp-progress__fill" style="transform:scaleX(${wdone ? 1 : wratio})"></div></div>
        <div class="gp-goal__foot"><span>${shortNumber(Math.min(wp, wt))} / ${shortNumber(wt)}</span><span class="gp-goal__reward">인장 +${wDef.seals}</span></div>
      </div>`;
    }

    // 로테이팅 일일 퀘스트(자정 리셋, 완료 시 '받기' 수동 클레임)
    const dailyRows = dailyQuestDefinitions.map((q) => {
      const p = gs.dailyQuestProgress(q.id);
      const done = gs.dailyQuestDone(q.id);
      const claimed = gs.dailyQuestClaimed(q.id);
      const claimable = done && !claimed;
      const ratio = Math.max(0, Math.min(1, p / q.target));
      const right = claimed
        ? `<span class="gp-goal__badge">완료</span>`
        : claimable
          ? `<button class="gp-btn gp-btn--sm gp-btn--ready" data-action="claimDaily" data-id="${q.id}">받기</button>`
          : `<span class="gp-goal__badge">오늘</span>`;
      // FIX P1: gp-goal--daily adds green tint to distinguish daily rows from neutral quest cards
      return `<div class="gp-goal gp-goal--daily ${claimed ? "gp-goal--done" : claimable ? "gp-goal--active" : ""}" data-goal-kind="daily" data-goal-id="${q.id}">
        <div class="gp-goal__head"><span class="gp-goal__title">${q.title}</span>${right}</div>
        <div class="gp-goal__desc">${q.desc}</div>
        <div class="gp-progress gp-goal__bar"><div class="gp-progress__fill" style="transform:scaleX(${done ? 1 : ratio})"></div></div>
        <div class="gp-goal__foot"><span>${shortNumber(Math.min(p, q.target))} / ${shortNumber(q.target)}</span><span class="gp-goal__reward">${rewardLabel(q.reward)}</span></div>
      </div>`;
    }).join("");
    const dailyClaimed = dailyQuestDefinitions.filter((q) => gs.dailyQuestClaimed(q.id)).length;

    let questRows = questDefinitions.map((q) =>
      goalRow(q, gs.data.quests[q.id] ? "done" : (active && q.id === active.id ? "active" : "locked"))
    ).join("");
    // 정의된 목표를 모두 완료하면 끝없는 누적-표 목표를 현재 진행 목표로 노출
    if (active && active.generated) questRows += goalRow(active, "active");

    const achRows = achievementDefinitions.map((a) => {
      const got = !!gs.data.achievements[a.id];
      const cur = gs.achievementProgress(a.metric);
      const ratio = Math.max(0, Math.min(1, cur / a.target));
      // P2 fix: replace emoji medals with reliable monochrome unicode (no WebView font-fallback risk)
      const medal = got ? "◆" : "◇";
      return `<div class="gp-ach ${got ? "gp-ach--got" : ""}" data-achievement-id="${a.id}">
        <span class="gp-ach__medal">${medal}</span>
        <span class="gp-ach__body"><span class="gp-ach__name">${a.name}</span><span class="gp-ach__desc">${got ? a.desc : `${a.desc} (${Math.floor(ratio * 100)}%)`}</span></span>
      </div>`;
    }).join("");
    const gotCount = achievementDefinitions.filter((a) => gs.data.achievements[a.id]).length;

    const titleProgress = active && active.generated
      ? `정규 완료 · 끝없는 목표 ${gs.data.endless + 1}단계`
      : `${doneCount}/${questDefinitions.length} 완료`;
    // P2 fix: wrap goallist in stafflist-wrap pattern so the fade gradient works
    // FIX P1: 📅 emoji replaced with unicode diamond to avoid Android WebView glyph fallback
    // 랭킹 버튼 — 클라우드(Firebase) 설정됐을 때만 노출(웹·앱 공통). 미설정 시 숨김.
    const rankBtn = cloudEnabled()
      ? `<button class="gp-btn gp-btn--sm gp-rankbtn" data-action="openRank">${iconHtml("ui-trophy", { size: 32 })}랭킹</button>` : "";
    this.panel.innerHTML = `<div class="gp-paneltitle gp-paneltitle--row"><span>운영 목표 · ${titleProgress}</span>${rankBtn}</div>
      <div class="gp-goallist-wrap"><div class="gp-stafflist gp-goallist">
      ${dailyRow}
      ${seasonCard}
      ${weeklyRow ? `<div class="gp-goal__section">&#9733; 주간 한정 · 일요일 종료</div>${weeklyRow}` : ""}
      <div class="gp-goal__section">&#9670; 일일 퀘스트 ${dailyClaimed}/${dailyQuestDefinitions.length} · 자정 초기화</div>${dailyRows}
      <div class="gp-goal__section">운영 목표</div>${questRows}
      <div class="gp-goal__section">업적 · ${gotCount}/${achievementDefinitions.length}</div>${achRows}</div><div class="gp-goallist-fade" aria-hidden="true"></div></div>`;
  }

  // 월간 시즌 — 무료 트랙 8단계. 단계 보상은 도달 즉시 자동 지급(받기 없음).
  _renderSeasonCard() {
    const gs = this.gameState;
    if (!gs.seasonState) return "";
    const st = gs.seasonState();
    const last = st.track[st.track.length - 1].need;
    const chips = st.track.map((t, i) => {
      const r = gs.seasonRewardAt(i);
      let ic = "";
      let label = "";
      if (r.kind === "hat") {
        const def = cosmeticById(r.id);
        ic = `<img class="gp-season__img" src="${def?.img || ""}" alt="">`;
        label = def?.name || "";
      } else if (r.kind === "title") {
        const def = titleById(r.id);
        ic = iconHtml("ui-star", { size: 32 });
        label = `발령 ${def?.name || ""}`;
      } else {
        ic = iconHtml(r.reward.seals ? "ui-seal" : "res-explain", { size: 32 });
        label = r.reward.seals ? `인장 +${r.reward.seals}` : `해명 +${shortNumber(r.reward.explain)}`;
      }
      const got = i < st.steps;
      const big = r.kind !== "reward";
      return `<span class="gp-season__step ${got ? "gp-season__step--got" : ""} ${big ? "gp-season__step--big" : ""}" title="${t.need}P · ${label}">${ic}<b>${got ? "✓" : t.need}</b></span>`;
    }).join("");
    const nextLine = st.next ? `다음 ${st.next.need}P` : "트랙 완료";
    const sp = SEASON_POINTS.special;
    return `<div class="gp-goal__section">${st.month}월 시즌 · ${st.theme.name}</div>
      <div class="gp-season" data-goal-kind="season" style="--season:${st.theme.color}">
        <div class="gp-goal__head"><span class="gp-goal__title">시즌 포인트 ${st.points}P</span><span class="gp-goal__badge gp-goal__badge--week">D-${st.daysLeft}</span></div>
        <div class="gp-progress gp-goal__bar"><div class="gp-progress__fill" style="transform:scaleX(${Math.min(1, st.points / last)})"></div></div>
        <div class="gp-season__track">${chips}</div>
        <div class="gp-goal__foot"><span>${nextLine} · ${st.steps}/${st.track.length}단계</span></div>
        <div class="gp-season__src">일일 퀘스트 +${SEASON_POINTS.daily} · 주간 목표 +${SEASON_POINTS.weekly} · 사건 결말 +${SEASON_POINTS.chainEnding} · 특별 개표소 등급 +${sp.bronze}~${sp.elite}</div>
      </div>`;
  }

  _goalsStructureSignature() {
    const gs = this.gameState;
    const daily = gs.dailyStatus?.();
    const season = gs.seasonState?.();
    const weekly = gs.weeklyDef?.();
    const active = gs.nextQuest();
    return JSON.stringify({
      attendance: daily?.available ? [daily.streak, daily.reward?.votes, daily.reward?.explain, daily.reward?.seals || 0] : null,
      weekly: weekly ? [weekly.id, gs.weeklyTarget(), gs.weeklyClaimed(), gs.weeklyClaimable(), gs.weeklyDaysLeft()] : null,
      daily: dailyQuestDefinitions.map((q) => [q.id, gs.dailyQuestClaimed(q.id), gs.dailyQuestClaimable(q.id)]),
      active: active ? [active.id, !!active.generated] : null,
      quests: questDefinitions.map((q) => !!gs.data.quests[q.id]),
      achievements: achievementDefinitions.map((a) => !!gs.data.achievements[a.id]),
      rank: cloudEnabled(),
      season: season ? [season.key, season.points, season.steps, season.daysLeft] : null,
    });
  }

  // 긴 목표 목록은 구조가 그대로인 연타 중 수치·막대만 갱신해 포커스와 스크롤 트리를 보존한다.
  _patchGoals() {
    const gs = this.gameState;
    const patchProgress = (row, progress, target, done = false) => {
      if (!row) return;
      const ratio = Math.max(0, Math.min(1, progress / target));
      const fill = row.querySelector(".gp-progress__fill");
      const value = row.querySelector(".gp-goal__foot > span:first-child");
      const transform = `scaleX(${done ? 1 : ratio})`;
      if (fill && fill.style.transform !== transform) fill.style.transform = transform;
      const text = `${shortNumber(Math.min(progress, target))} / ${shortNumber(target)}`;
      if (value && value.textContent !== text) value.textContent = text;
    };

    const weeklyRow = this.panel.querySelector('[data-goal-kind="weekly"]');
    if (weeklyRow) patchProgress(weeklyRow, gs.weeklyProgress(), gs.weeklyTarget(), gs.weeklyDone());

    dailyQuestDefinitions.forEach((q) => {
      patchProgress(
        this.panel.querySelector(`[data-goal-kind="daily"][data-goal-id="${q.id}"]`),
        gs.dailyQuestProgress(q.id),
        q.target,
        gs.dailyQuestDone(q.id),
      );
    });

    const active = gs.nextQuest();
    const definitions = active?.generated ? [...questDefinitions, active] : questDefinitions;
    definitions.forEach((q) => {
      patchProgress(
        this.panel.querySelector(`[data-goal-kind="quest"][data-goal-id="${q.id}"]`),
        gs.questProgress(q),
        q.target,
        !!gs.data.quests[q.id],
      );
    });

    achievementDefinitions.forEach((achievement) => {
      if (gs.data.achievements[achievement.id]) return;
      const row = this.panel.querySelector(`[data-achievement-id="${achievement.id}"]`);
      const description = row?.querySelector(".gp-ach__desc");
      const ratio = Math.max(0, Math.min(1, gs.achievementProgress(achievement.metric) / achievement.target));
      const text = `${achievement.desc} (${Math.floor(ratio * 100)}%)`;
      if (description && description.textContent !== text) description.textContent = text;
    });
  }

  _renderPrestige() {
    const gs = this.gameState;
    const projection = gs.prestigeProjection();
    const preview = projection.earned;
    const can = preview > 0;
    const advice = projection.advice || { key: "locked", label: "준비 중", detail: "감사 조건을 달성하세요" };
    const gainLabel = can ? `영구 생산 +${projection.gainPct.toFixed(1)}%` : "영구 상승 계산 중";
    // FIX #8: prestige upgrades use .gp-seal (gem-blue) not .gp-fac (gold) — distinct economy, distinct look
    // FIX P1: track _selectedSeal — default to first affordable, or first upgradeable; apply gp-seal--active
    const firstAffordable = prestigeUpgrades.find((u) => {
      const lv = gs.prestigeUpgradeLevel(u.id);
      const cost = gs.prestigeUpgradeCost(u.id);
      return gs.data.prestige.seals >= cost && lv < gs.effectiveMaxLevel(u);
    });
    if (!this._selectedSeal) this._selectedSeal = firstAffordable?.id || prestigeUpgrades[0]?.id;
    const sel = this._selectedSeal;
    const selDef = prestigeUpgrades.find((u) => u.id === sel);
    const selLv = selDef ? gs.prestigeUpgradeLevel(sel) : 0;
    const selCost = selDef ? gs.prestigeUpgradeCost(sel) : 0;
    const selCanBuy = selDef && gs.data.prestige.seals >= selCost && selLv < gs.effectiveMaxLevel(selDef);

    const ups = prestigeUpgrades.map((u) => {
      const lv = gs.prestigeUpgradeLevel(u.id);
      const cost = gs.prestigeUpgradeCost(u.id);
      const isActive = u.id === sel;
      // FIX P1: gp-seal--locked only for max-level seals; unaffordable seals stay visible (not dimmed)
      const maxed = lv >= gs.effectiveMaxLevel(u);
      return `<button class="gp-seal ${isActive ? "gp-seal--active" : ""} ${maxed ? "gp-seal--locked" : ""}" data-action="buyPrestige" data-id="${u.id}"><span class="gp-seal__role">${u.shortName}</span><span class="gp-seal__lv">${maxed ? `완료` : `Lv.${lv} · ${cost}`}</span></button>`;
    }).join("");

    const fullMult = gs.prestigeMultiplierFor(gs.data) * (1 + (gs.permanentEffectFor ? gs.permanentEffectFor(gs.data, "cpsPct") : 0));
    // Selected seal detail card shown below grid for context before buying
    const detailCard = selDef ? `<div class="gp-card" style="margin-top:8px">
      <div class="gp-card__body">
        <div class="gp-card__title">${selDef.shortName} Lv.${selLv}</div>
        <div class="gp-card__sub">${selDef.desc || ""}</div>
        <div class="gp-card__gain">비용: 인장 ${selCost}</div>
      </div>
      <button class="gp-btn gp-btn--sm gp-btn--gold ${selCanBuy ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="buyPrestige" data-id="${sel}">구매</button>
    </div>` : "";

    const medalSection = this._renderMedalSection();

    this.panel.innerHTML = `<div class="gp-paneltitle">감사 재정비 · 인장 ${gs.data.prestige.seals} · ${iconHtml("ui-medal", { size: 32 })}훈장 ${gs.data.prestige.medals} · 영구 x${fullMult.toFixed(2)}</div>
      ${this._renderCharacterCard()}
      ${this._renderGachaCard()}
      ${this._renderCosmeticCard()}
      <div class="gp-sealgrid">${ups}</div>
      ${detailCard}
      ${medalSection}
      <div class="gp-prestige-advice gp-prestige-advice--${advice.key}">
        <span><b>${gainLabel}</b><small>${advice.detail}</small></span>
        <em>${advice.label}</em>
      </div>
      ${can && projection.earnedIn1h > preview ? `<div class="gp-prestige-later">지금 감사 <b>+${preview}</b> 인장 · 1시간 더 키우면 <b>+${projection.earnedIn1h}</b></div>` : ""}
      <div class="gp-region"><span>예상 획득 +${preview}${gs.medalPreview() > 0 ? ` · 훈장+${gs.medalPreview()}` : ""}</span><button class="gp-btn gp-btn--sm gp-btn--danger ${can ? "" : "gp-btn--disabled"}" data-action="prestigeReset">감사실행</button></div>`;

    // Wire seal + medal selection clicks (re-render with new selection, don't buy immediately)
    this.panel.querySelectorAll(".gp-seal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.dataset.medal === "1") this._selectedMedal = btn.dataset.id;
        else this._selectedSeal = btn.dataset.id;
        this._renderPrestige();
      });
    });
  }

  // 인사 발령 뽑기 — 해명으로 국장 칭호(능력)를 뽑는 가챠. 대표 칭호·보유 현황·비용·뽑기 버튼.
  _renderGachaCard() {
    const gs = this.gameState;
    const cost = gs.gachaDrawCost();
    const can = gs.canDrawGacha();
    const owned = gachaTitles.filter((t) => (gs.data.titles[t.id] || 0) > 0).length;
    const eq = gs.equippedTitleDef();
    const eqLv = eq ? (gs.data.titles[eq.id] || 0) : 0;
    const eqLine = eq
      ? `<span class="gp-gacha__eqname" style="color:${RARITY_COLOR[eq.rarity]}">${iconHtml(eq.icon, { size: 32 })}${eq.name} Lv.${eqLv}</span> · ${eq.per}`
      : `<span class="gp-card__sub">아직 발령 없음</span>`;
    // 보유 칭호 미니 칩(보유한 것만, 등급색)
    const chips = govTitles.filter((t) => (gs.data.titles[t.id] || 0) > 0)
      .map((t) => `<span class="gp-gacha__chip" style="border-color:${RARITY_COLOR[t.rarity]};color:${RARITY_COLOR[t.rarity]}" title="${t.name} · ${t.per}">${iconHtml(t.icon, { size: 32 })}${(gs.data.titles[t.id] || 0)}</span>`)
      .join("");
    // 확률 표기(weight 합산) + 소프트 천장 카운터 — 투명한 뽑기
    const wSum = (r) => gachaTitles.filter((t) => t.rarity === r).reduce((a, t) => a + t.weight, 0);
    const total = gachaTitles.reduce((a, t) => a + t.weight, 0);
    const pct = (r) => Math.round((wSum(r) / total) * 100);
    const pityLeft = gs.gachaPityLeft ? gs.gachaPityLeft() : null;
    const oddsLine = `<div class="gp-gacha__odds">일반 ${pct("common")}% · 고급 ${pct("uncommon")}% · 희귀 ${pct("rare")}%${pityLeft !== null ? ` · 희귀 확정까지 ${pityLeft}회` : ""}</div>`;
    return `<div class="gp-gacha">
      <div class="gp-gacha__hd">${iconHtml("ui-dice", { size: 32 })}인사 발령 뽑기 <span class="gp-gacha__count">보유 ${owned}/${gachaTitles.length}</span></div>
      <div class="gp-gacha__eq">${eqLine}</div>
      ${chips ? `<div class="gp-gacha__chips">${chips}</div>` : ""}
      ${oddsLine}
      <div class="gp-gacha__btns">
        <button class="gp-btn gp-btn--sm ${can ? "gp-btn--ready gp-btn--gold" : "gp-btn--disabled"}" data-action="drawGacha">뽑기 · 해명 ${shortNumber(cost)}</button>
        <button class="gp-btn gp-btn--sm ${can ? "gp-btn--gold" : "gp-btn--disabled"}" data-action="drawGacha10">10연차</button>
      </div>
    </div>`;
  }

  // 국장 캐릭터 선택 — 3종을 카드로(현재 선택=강조). 각자 외형+특성. 탭하면 변경(모든 리셋에도 유지).
  _renderCharacterCard() {
    const gs = this.gameState;
    const cur = gs.currentCharacter ? gs.currentCharacter().id : "classic";
    const opts = characters.map((c) => {
      const on = c.id === cur;
      return `<button class="gp-char__opt ${on ? "gp-char__opt--on" : ""}" data-action="selectChar" data-id="${c.id}">
        <span class="gp-char__ic">${iconHtml(c.icon, { size: 72 })}</span>
        <span class="gp-char__name">${c.name}</span>
        <span class="gp-char__trait">${c.traitText}</span>
      </button>`;
    }).join("");
    return `<div class="gp-gacha gp-charcard">
      <div class="gp-gacha__hd">${iconHtml("ui-people", { size: 32 })}국장 캐릭터</div>
      <div class="gp-char__grid">${opts}</div>
    </div>`;
  }

  // 국장 꾸미기 — 슬롯별 보유 액세서리를 칩으로(장착=강조, 미해금=잠금+힌트). 탭하면 장착/해제.
  _renderCosmeticCard() {
    const gs = this.gameState;
    const owned = gs.ownedCosmeticCount();
    const slotLabel = { hat: "머리", face: "얼굴" };
    const rows = COSMETIC_SLOTS.map((slot) => {
      const eq = gs.equippedCosmetic(slot);
      // 시즌 한정 모자는 보유했거나 이번 달 테마일 때만 칩으로 보인다(나머지 5종 잠금 칩으로 줄을 채우지 않는다).
      const seasonHat = gs.seasonState ? gs.seasonState().theme.hat : null;
      const chips = cosmetics.filter((c) => c.slot === slot && (c.unlock?.type !== "season" || c.id === seasonHat || gs.ownsCosmetic(c.id))).map((c) => {
        const has = gs.ownsCosmetic(c.id);
        if (!has) return `<span class="gp-cos__chip gp-cos__chip--lock" title="${c.name} · ${c.hint}">${iconHtml("ui-lock", { size: 32 })}</span>`;
        const on = eq === c.id;
        return `<button class="gp-cos__chip ${on ? "gp-cos__chip--on" : ""}" data-action="equipCos" data-id="${c.id}" title="${c.name}${on ? " (장착중·탭하면 벗기)" : ""}">${c.img ? `<img class="gp-cos__img" src="${c.img}" alt="${c.name}">` : iconHtml(c.icon, { size: 32 })}</button>`;
      }).join("");
      return `<div class="gp-cos__row"><span class="gp-cos__slot">${slotLabel[slot] || slot}</span><div class="gp-cos__chips">${chips || "—"}</div></div>`;
    }).join("");
    return `<div class="gp-gacha gp-cos">
      <div class="gp-gacha__hd">${iconHtml("cos-tophat", { size: 32 })}국장 꾸미기 <span class="gp-gacha__count">보유 ${owned}/${cosmetics.length}</span></div>
      ${rows}
    </div>`;
  }

  // 훈장(2차 통화) 전당 — 인장 트리와 시각·경제를 구분(금색 강조). 미해금 시엔 획득법 안내만 노출.
  _renderMedalSection() {
    const gs = this.gameState;
    const unlocked = (gs.data.prestige.totalMedals || 0) > 0 || (gs.data.prestige.medals || 0) > 0;
    if (!unlocked) {
      return `<div class="gp-goal__section" style="margin-top:10px">${iconHtml("ui-medal", { size: 32 })}훈장 전당 · 2차</div>
        <div class="gp-card__sub" style="padding:2px 4px 0;opacity:.78">새 구역을 처음 돌파하면 <b>훈장</b>을 얻어 영구 메타 강화를 해금합니다.</div>`;
    }
    const medalFirst = medalUpgrades.find((u) => {
      if (u.rule || u.agency) return false;
      const lv = gs.prestigeUpgradeLevel(u.id);
      return gs.data.prestige.medals >= gs.prestigeUpgradeCost(u.id) && lv < u.maxLevel;
    });
    if (!this._selectedMedal) this._selectedMedal = medalFirst?.id || medalUpgrades[0]?.id;
    const sel = this._selectedMedal;
    const selDef = medalUpgrades.find((u) => u.id === sel);
    const selLv = selDef ? gs.prestigeUpgradeLevel(sel) : 0;
    const selCost = selDef ? gs.prestigeUpgradeCost(sel) : 0;
    const selCanBuy = selDef && gs.data.prestige.medals >= selCost && selLv < selDef.maxLevel;

    const grid = medalUpgrades.filter((u) => !u.rule && !u.agency).map((u) => {
      const lv = gs.prestigeUpgradeLevel(u.id);
      const cost = gs.prestigeUpgradeCost(u.id);
      const isActive = u.id === sel;
      const maxed = lv >= u.maxLevel;
      // 금색 강조로 인장(gem-blue)과 경제 구분
      return `<button class="gp-seal gp-seal--medal ${isActive ? "gp-seal--active" : ""} ${maxed ? "gp-seal--locked" : ""}" data-action="buyPrestige" data-id="${u.id}" data-medal="1" style="border-color:${isActive ? "#ffd479" : "rgba(255,212,121,.35)"}"><span class="gp-seal__role">${u.shortName}</span><span class="gp-seal__lv">${maxed ? `완료` : `Lv.${lv} · ${cost}`}</span></button>`;
    }).join("");

    const detail = selDef ? `<div class="gp-card" style="margin-top:8px;border-color:rgba(255,212,121,.3)">
      <div class="gp-card__body">
        <div class="gp-card__title">${selDef.shortName} Lv.${selLv}${selDef.maxLevel >= 999 ? "" : `/${selDef.maxLevel}`}</div>
        <div class="gp-card__sub">${selDef.desc || ""}</div>
        <div class="gp-card__gain">비용: 훈장 ${selCost}</div>
      </div>
      <button class="gp-btn gp-btn--sm gp-btn--gold ${selCanBuy ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="buyPrestige" data-id="${sel}">구매</button>
    </div>` : "";

    // 조례: 1회 구매로 규칙이 바뀌는 해금(중반 사막 해소)
    const rules = medalUpgrades.filter((u) => u.rule).map((u) => {
      const owned = gs.hasRule?.(u.id);
      const cost = gs.prestigeUpgradeCost(u.id);
      const can = !owned && gs.data.prestige.medals >= cost;
      return `<div class="gp-rule${owned ? " gp-rule--on" : ""}"><span class="gp-rule__body"><b>${u.name}</b><small>${u.desc}</small></span>${owned ? `<em>시행 중</em>` : `<button class="gp-btn gp-btn--sm gp-btn--gold ${can ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="buyPrestige" data-id="${u.id}">훈장 ${cost}</button>`}</div>`;
    }).join("");
    return `<div class="gp-goal__section" style="margin-top:10px">${iconHtml("ui-medal", { size: 32 })}훈장 전당 · 2차 · 보유 ${gs.data.prestige.medals}</div>
      <div class="gp-sealgrid">${grid}</div>
      ${detail}
      <div class="gp-goal__section" style="margin-top:10px">조례 · 새 규칙</div>
      <div class="gp-rules">${rules}</div>
      <div class="gp-goal__section" style="margin-top:10px">기관 소집 · 새 사건</div>
      <div class="gp-rules">${this._agencyRows()}</div>`;
  }

  // 기관 소집 — 1회 구매로 그 기관 사건이 일반 사건 사이에 섞인다(AGENCY_EVENT_CHANCE).
  _agencyRows() {
    const gs = this.gameState;
    const cert = gs.certProgress();
    return gs.agencyStatus().map((a) => {
      const cost = gs.prestigeUpgradeCost(a.upgradeId);
      const can = !a.unlocked && gs.data.prestige.medals >= cost;
      const extra = a.id === "monitor" && a.unlocked ? ` · 인증 ${cert.cert}/${cert.per}` : "";
      const right = a.unlocked
        ? `<em>처리 ${a.done}건</em>`
        : `<button class="gp-btn gp-btn--sm gp-btn--gold ${can ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="buyPrestige" data-id="${a.upgradeId}">훈장 ${cost}</button>`;
      return `<div class="gp-rule gp-agency${a.unlocked ? " gp-rule--on" : ""}" style="--ag:${a.color}"><span class="gp-rule__body"><b>${a.name}</b><small>${a.desc}</small>${a.unlocked ? `<small>사건 ${a.seen}/${a.total}종${extra}</small>` : ""}</span>${right}</div>`;
    }).join("");
  }

  // 사건 탭: 소집한 기관이 있으면 기관 사건 확률·생중계 남은 시간·인증 점수를 한 줄로.
  _agencyLine() {
    const gs = this.gameState;
    const on = gs.agencyStatus().filter((a) => a.unlocked);
    if (!on.length) return "";
    const parts = [`<b>기관 ${on.map((a) => a.short).join("·")}</b>`];
    if (on.some((a) => a.id === "monitor")) { const c = gs.certProgress(); parts.push(`<span>인증 ${c.cert}/${c.per}</span>`); }
    const b = gs.data.buffs || {};
    const left = gs.goldenBuffRemainingMs();
    if (left > 0 && b.prodMult === ON_AIR_MULT) parts.push(`<span>생중계 ×${ON_AIR_MULT} ${Math.ceil(left / 1000)}초</span>`);
    else parts.push(`<span>사건 ${Math.round(AGENCY_EVENT_CHANCE * 100)}%가 기관 사건</span>`);
    return `<div class="gp-chainline gp-agencyline">${parts.join("")}</div>`;
  }
}
