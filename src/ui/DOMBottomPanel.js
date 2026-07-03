import { shortNumber } from "../utils/format.js";
import { facilities } from "../data/facilities.js";
import { staffDefinitions, rarityColors } from "../data/staff.js";
import { officeEvents, realEventIds } from "../data/events.js";
import { prestigeUpgrades, medalUpgrades } from "../data/prestige.js";
import { questDefinitions } from "../data/quests.js";
import { achievementDefinitions } from "../data/achievements.js";
import { facilityIconUri, workerIconUri, tabIconUri } from "../world/dotChar.js";
import { dailyQuestDefinitions } from "../data/dailyQuests.js";
import { govTitles, titleById, RARITY_LABEL, RARITY_COLOR } from "../data/titles.js";
import { cosmetics, COSMETIC_SLOTS } from "../data/cosmetics.js";
import { characters } from "../data/characters.js";
import { cloudEnabled } from "../firebaseConfig.js";

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

export class DOMBottomPanel {
  constructor(gameState) {
    this.gameState = gameState;
    this.currentEvent = null;
    this.buyQty = 1; // 일괄구매 수량: 1 | 10 | "max" (시설/직원 공유)
    this.root = document.createElement("div");
    this.root.className = "gp-bottom";
    this.root.innerHTML = `<div class="gp-panel" data-k="panel"></div><div class="gp-tabs" data-k="tabs"></div>`;

    const tabsEl = this.root.querySelector('[data-k="tabs"]');
    TABS.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.className = "gp-tab";
      b.dataset.tab = id;
      b.innerHTML = `<span class="gp-tab__ic" style="background-image:url('${tabIconUri(id)}')"></span>${label}<span class="gp-tab__dot" data-dot="${id}" hidden></span>`;
      b.addEventListener("click", () => this.gameState.setTab(id));
      tabsEl.appendChild(b);
    });

    this.panel = this.root.querySelector('[data-k="panel"]');
    this.panel.addEventListener("click", (e) => this._onClick(e));
    this._refresh = () => this.refresh();
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
    this.refresh();

    // 패널 실높이를 게임좌표로 환산해 브로드캐스트 — 월드 카메라가 따라 올라가
    // 어떤 탭/기기에서도 국장·시설·초당표가 패널에 잘리지 않게 한다(BUG2).
    this._panelParent = parent;
    this._ro = new ResizeObserver(() => this._emitSheetTop());
    this._ro.observe(this.root);
    this._emitSheetTop();
  }

  _emitSheetTop() {
    try {
      const ui = this._panelParent.getBoundingClientRect();
      if (!ui.height) return;
      const t = this.root.getBoundingClientRect().top;
      const topGame = (t - ui.top) * (844 / ui.height); // FIT 스케일 대응
      // FAB(러시/브리핑) 동적 앵커용 — 패널 실높이를 CSS 변수로 기록
      this._panelParent.style.setProperty("--panel-h", `${Math.round(ui.bottom - t)}px`);
      document.dispatchEvent(new CustomEvent("gp:sheet-top", { detail: { topGame } }));
    } catch {}
  }

  destroy() {
    this._ro?.disconnect();
    this.gameState.off("changed", this._refresh);
    // Clean up world overlays injected in mount() to avoid orphaned DOM on prestige reset
    this._scanlines?.remove();
    this._vignette?.remove();
    this.root.remove();
  }

  _onClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const gs = this.gameState;
    const id = el.dataset.id;
    switch (el.dataset.action) {
      case "selectFac": gs.select(id); break;
      case "upgradeFac": gs.bulkUpgrade(gs.data.selected, this.buyQty); break;
      case "advanceStage": gs.advanceStage(); break;
      case "hire": gs.bulkHire(id, this.buyQty); break;
      case "setBuyQty": this.buyQty = (id === "max" ? "max" : Number(id)); this.refresh(); break;
      case "getEvent": if (gs.eventReady()) { this.currentEvent = this._pickEvent(); this.refresh(); } break;
      case "eventChoice": {
        const ev = officeEvents.find((v) => v.id === id);
        let firstSeen = false;
        if (ev) {
          gs.applyEffect((el.dataset.side === "left" ? ev.left : ev.right)[1]);
          firstSeen = gs.markEventSeen(ev.id); // 사건 도감 — 첫 수집이면 true
        }
        document.dispatchEvent(new CustomEvent("gp:event-resolved", { detail: { id: ev?.id, title: ev?.title, real: ev ? realEventIds.has(ev.id) : false, firstSeen } }));
        this.currentEvent = null;
        this.refresh();
        break;
      }
      case "drawGacha": {
        const res = gs.drawGacha();
        if (res) document.dispatchEvent(new CustomEvent("gp:gacha-result", { detail: res }));
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
    const gs = this.gameState;
    const avail = officeEvents.filter((ev) => gs.data.stage.area >= (ev.minStage || 1));
    if (!avail.length) return null;
    // 데이터 weight 가중 추첨 + 미수집 사건 가중치 상향(도감 완성이 RNG 그라인드가 되지 않게).
    // 미수집은 ×2.5로 더 자주 등장하되, 수집한 사건도 계속 나와 다양성/재대응은 유지.
    const w = (ev) => (ev.weight || 1) * (gs.hasSeenEvent(ev.id) ? 1 : 2.5);
    const total = avail.reduce((s, ev) => s + w(ev), 0);
    let roll = Math.random() * total;
    for (const ev of avail) {
      roll -= w(ev);
      if (roll < 0) return ev;
    }
    return avail[avail.length - 1];
  }

  refresh() {
    const tab = this.gameState.data.activeTab || "facilities";
    const prevScroll = this.panel.querySelector(".gp-stafflist")?.scrollTop || 0;
    ({
      facilities: () => this._renderFacilities(),
      crew: () => this._renderCrew(),
      events: () => this._renderEvents(),
      goals: () => this._renderGoals(),
      prestige: () => this._renderPrestige(),
    }[tab] || (() => this._renderFacilities()))();
    const list = this.panel.querySelector(".gp-stafflist");
    if (list && prevScroll) list.scrollTop = prevScroll;
    this.root.querySelectorAll(".gp-tab").forEach((el) => el.classList.toggle("gp-tab--active", el.dataset.tab === tab));
    this._updateBadges(tab);
  }

  // 탭 알림 점: 사건 대응 가능 시 사건 탭에 표시(해당 탭을 보고 있으면 숨김)
  _updateBadges(activeTab) {
    const gs = this.gameState;
    const eventDot = this.root.querySelector('[data-dot="events"]');
    if (eventDot) eventDot.hidden = !(gs.eventReady() && activeTab !== "events");
    // 목표 탭: 일일 퀘스트 수령 가능 시 알림 점
    const goalDot = this.root.querySelector('[data-dot="goals"]');
    const goalClaimable = (gs.anyDailyQuestClaimable && gs.anyDailyQuestClaimable()) || (gs.weeklyClaimable && gs.weeklyClaimable()) || (gs.dailyStatus && gs.dailyStatus().available);
    if (goalDot) goalDot.hidden = !(goalClaimable && activeTab !== "goals");
  }

  // 일괄구매 수량 토글(x1 / x10 / MAX) — 시설·직원 탭 공유
  _qtyToggle() {
    const opts = [["1", "x1"], ["10", "x10"], ["max", "MAX"]];
    return `<div class="gp-qty">${opts.map(([v, l]) =>
      `<button class="gp-qtybtn ${String(this.buyQty) === v ? "gp-qtybtn--on" : ""}" data-action="setBuyQty" data-id="${v}">${l}</button>`
    ).join("")}</div>`;
  }

  _renderFacilities() {
    const gs = this.gameState;
    const sel = gs.facility(gs.data.selected) ? gs.data.selected : "desk";
    const f = gs.facility(sel);
    const unlocked = gs.isUnlocked(sel);
    const cost = gs.cost(sel);
    const ex = gs.explainCost(sel);
    const stageDone = gs.data.stage.progress >= gs.data.stage.target;
    // 일괄구매 플랜(현재 수량 기준)
    const plan = unlocked ? gs.facilityBulkPlan(sel, this.buyQty) : { levels: 0, voteCost: 0, explainCost: 0 };
    const canBuy = unlocked && plan.levels > 0 && gs.data.votes >= plan.voteCost && gs.data.explain >= plan.explainCost;
    const qtyTag = this.buyQty === "max" ? (plan.levels > 0 ? `+${plan.levels}Lv` : "MAX") : `×${plan.levels || this.buyQty}`;
    const costStr = plan.levels > 0 ? `${shortNumber(plan.voteCost)}표` : "부족";
    // FIX #4: two-line upgrade button — verb on top, cost below — prevents truncation at any number length
    const upgradeBtn = unlocked
      ? `<button class="gp-btn gp-btn--gold gp-btn--upgrade ${canBuy ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="upgradeFac">업그레이드<small>${costStr}${this.buyQty !== 1 ? ` · ${qtyTag}` : ""}</small></button>`
      : `<button class="gp-btn gp-btn--upgrade gp-btn--disabled" data-action="upgradeFac">잠김</button>`;
    this.panel.innerHTML = `
      <div class="gp-card">
        <div class="gp-card__icon" style="background-image:url('${facilityIconUri(sel)}');background-color:${hex(f.color)}"></div>
        <div class="gp-card__body">
          <div class="gp-card__title">${f.name} Lv.${gs.level(sel)}</div>
          <div class="gp-card__sub">${unlocked ? `${shortNumber(cost)}표 · 해명 ${shortNumber(ex)}` : `${f.unlock}구역에서 해금`}</div>
          ${unlocked ? `<div class="gp-card__gain">▲ 업그레이드 시 초당 +${f.cps}표</div>` : ""}
          ${unlocked && gs.nextFacilityMilestone(gs.level(sel)) != null
            ? `<div class="gp-card__milestone">★ Lv.${gs.nextFacilityMilestone(gs.level(sel))} 달성 시 생산 ×2</div>`
            : ""}
        </div>
        ${upgradeBtn}
      </div>
      ${unlocked ? this._qtyToggle() : ""}
      <div class="gp-facsel">${facilities.map((ff) => {
        const u = gs.isUnlocked(ff.id);
        // P1 fix: facility picker icon — use webp asset as background-image, color as fallback
      return `<button class="gp-fac ${ff.id === sel ? "gp-fac--active" : ""} ${u ? "" : "gp-fac--locked"}" data-action="selectFac" data-id="${ff.id}"><span class="gp-fac__icon" style="background-image:url('${facilityIconUri(ff.id)}')"></span><span class="gp-fac__role">${ff.role}</span><span class="gp-fac__lv">${u ? `Lv.${gs.level(ff.id)}` : `${ff.unlock}구`}</span></button>`;
      }).join("")}</div>
      <div class="gp-region"><span>${gs.data.stage.area}구역 · ${shortNumber(gs.data.stage.progress)} / ${shortNumber(gs.data.stage.target)}</span>${
        stageDone
          ? `<button class="gp-btn gp-btn--sm" data-action="advanceStage">지역완료 ✓</button>`
          : `<span class="gp-stage-frac">${Math.floor((gs.data.stage.progress / gs.data.stage.target) * 100)}%</span>`
      }</div>
      ${this._nextUnlockTeaser()}`;
  }

  // 다음 해금 티저: 아직 잠긴 시설 중 가장 먼저 열리는 것을 한 줄 안내(진행 동기 부여)
  // FIX P1: emoji 🔒 replaced with CSS-safe unicode square to avoid Android WebView glyph fallback failure
  _nextUnlockTeaser() {
    const gs = this.gameState;
    const locked = gs.lockedFacilities ? gs.lockedFacilities() : [];
    if (!locked.length) return "";
    const next = locked.reduce((a, b) => ((b.unlock || 1) < (a.unlock || 1) ? b : a));
    return `<div class="gp-nextunlock"><span style="font-size:9px;color:var(--ink-soft);vertical-align:middle">&#9632;</span> 다음 해금: <b>${next.name}</b> · ${next.unlock}구역 도달 시</div>`;
  }

  _renderCrew() {
    const gs = this.gameState;
    // P2 fix: detect light-luminance rarity colors for badge contrast swap
    const isLightColor = (hex6) => {
      const r = (hex6 >> 16) & 0xff, g = (hex6 >> 8) & 0xff, b = hex6 & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) > 153; // > 60% luminance
    };
    const cards = staffDefinitions.map((s) => {
      const lv = gs.staffLevel(s.id);
      const plan = gs.staffBulkPlan(s.id, this.buyQty);
      const can = plan.levels > 0 && gs.data.votes >= plan.voteCost && gs.data.explain >= plan.explainCost;
      const skill = s.skill ? (gs.staffSkillActive(s.id) ? s.skill.name : `스킬 Lv.${s.skill.unlockLevel}`) : "";
      // 시너지: 대응 시설과 곱연산 — 빌드 방향 표시(활성 시 강조)
      const synFac = s.synergy ? facilities.find((f) => f.id === s.synergy.facility) : null;
      const synActive = synFac && lv > 0 && gs.level(synFac.id) > 0;
      const synLabel = synFac ? `<span class="gp-staff__syn${synActive ? " gp-staff__syn--on" : ""}">◈ ${synFac.name} 시너지</span>` : "";
      const rarityHex = rarityColors[s.rarity] || 0xd8c4a0;
      const lightRarity = isLightColor(rarityHex) ? " gp-staff--light-rarity" : "";
      // P0 fix: show 해명 cost in hire button (two-line pattern); add gp-btn--ready glow when affordable
      return `<div class="gp-staff${lightRarity}" style="--rarity-color:${hex(rarityHex)}">
        <div class="gp-staff__dot" style="background-color:${hex(s.color)};background-image:url('${workerIconUri()}')"></div>
        <div class="gp-staff__body"><div class="gp-staff__name">${s.name}<span class="gp-staff__rar">${s.rarityName}</span></div><div class="gp-staff__sub">Lv.${lv} · ${skill}</div><div class="gp-staff__sub">${synLabel}</div></div>
        <button class="gp-btn gp-btn--sm gp-btn--upgrade ${can ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="hire" data-id="${s.id}">${shortNumber(plan.voteCost)}표<small>${this.buyQty !== 1 ? (this.buyQty === "max" ? (plan.levels > 0 ? `MAX +${plan.levels}` : "MAX") : `×${plan.levels || this.buyQty}`) : `${shortNumber(plan.explainCost)}해명`}</small></button></div>`;
    }).join("");
    // FIX P2: multiplier shown as "+69% 생산 보너스" sub-label (not "x1.69" debug-looking number in title)
    const mult = gs.staffMultiplierFor(gs.data);
    const multLabel = mult < 10
      ? `<span class="gp-card__gain">+${((mult - 1) * 100).toFixed(0)}% 생산 보너스</span>`
      : `<span class="gp-card__gain">x${mult.toFixed(1)} 생산</span>`;
    // Scroll fade is a real div (not ::after) for reliable WebView support
    this.panel.innerHTML = `<div class="gp-paneltitle gp-paneltitle--row">직원 채용 ${multLabel}${this._qtyToggle()}</div><div class="gp-stafflist-wrap"><div class="gp-stafflist">${cards}</div><div class="gp-stafflist-fade" aria-hidden="true"></div></div>`;
  }

  _renderEvents() {
    const gs = this.gameState;
    const ev = this.currentEvent;
    if (ev) {
      const real = realEventIds.has(ev.id);
      const realBadge = real ? `<div class="gp-event__real">🏛 영감받은 각색</div>` : "";
      // 선택 결과 수치 미리보기 — 신규 유저도 결과 예측 가능(사이다 예고 포함)
      const fx = (eff) => {
        const scale = gs.eventRewardScale ? gs.eventRewardScale() : 1;
        const parts = [];
        if (eff.votes) parts.push(`<i class="${eff.votes > 0 ? "gp-fx--up" : "gp-fx--dn"}">표 ${eff.votes > 0 ? "+" : ""}${shortNumber(Math.round(eff.votes > 0 ? eff.votes * scale : eff.votes))}</i>`);
        if (eff.explain) parts.push(`<i class="${eff.explain > 0 ? "gp-fx--up" : "gp-fx--dn"}">해명 ${eff.explain > 0 ? "+" : ""}${shortNumber(Math.round(eff.explain > 0 ? eff.explain * scale : eff.explain))}</i>`);
        if (eff.trust) parts.push(`<i class="${eff.trust > 0 ? "gp-fx--up" : "gp-fx--dn"}">믿음 ${eff.trust > 0 ? "+" : ""}${eff.trust}</i>`);
        if ((eff.trust || 0) >= 12) parts.push(`<i class="gp-fx--cider">🔥사이다</i>`);
        return `<span class="gp-event__fx">${parts.join("")}</span>`;
      };
      this.panel.innerHTML = `<div class="gp-event${real ? " gp-event--real" : ""}">${realBadge}<div class="gp-event__title">${ev.title}</div><div class="gp-event__body">${ev.body}</div>
        <div class="gp-event__choices">
          <button class="gp-btn gp-event__c" data-action="eventChoice" data-id="${ev.id}" data-side="left">${ev.left[0]}<small>${ev.left[2]}</small>${fx(ev.left[1])}</button>
          <button class="gp-btn gp-event__c" data-action="eventChoice" data-id="${ev.id}" data-side="right">${ev.right[0]}<small>${ev.right[2]}</small>${fx(ev.right[1])}</button>
        </div></div>`;
    } else {
      const log = (gs.data.log || []).slice(0, 3).map((l) => `<div class="gp-logline">${l}</div>`).join("");
      const ready = gs.eventReady();
      const remainMs = gs.eventCooldownRemainingMs ? gs.eventCooldownRemainingMs() : 0;
      const totalMs = gs.eventCooldownTotalMs ? gs.eventCooldownTotalMs() : remainMs;
      const sec = Math.ceil(remainMs / 1000);
      const btn = ready
        ? `<button class="gp-btn gp-btn--event" data-action="getEvent">사건 받기</button>`
        : `<button class="gp-btn gp-btn--event gp-btn--disabled" data-action="getEvent">다음 사건까지 ${sec}초</button>`;
      // 사건 도감 진척을 사건 탭에 노출 — 수집 동기를 사건 발생 지점에 배치
      const dexN = gs.seenEventCount();
      const dexTotal = officeEvents.length;
      const nextM = gs.nextDexMilestone();
      const dexPct = Math.round(gs.dexBonusPct() * 100);
      const dexLine = nextM
        ? `📖 도감 ${dexN}/${dexTotal} · 생산 +${dexPct}% · ${nextM.n}종에서 +${Math.round(nextM.pct * 100)}%`
        : `📖 도감 ${dexN}/${dexTotal} 완성! · 생산 +${dexPct}% 영구`;
      this.panel.innerHTML = `<div class="gp-paneltitle">📋 사건 대응실 · 처리 ${gs.data.stats.totalEvents}건</div><div class="gp-card__sub">사건 대응으로 표·믿음을 얻으세요 · 보상 x${gs.eventRewardScale().toFixed(1)}</div>${btn}<div class="gp-dexline">${dexLine}</div><div class="gp-log">${log}</div>`;
      // P1 fix: drive cooldown sweep --cd-pct on the disabled button each second
      if (!ready && totalMs > 0) {
        const btnEl = this.panel.querySelector(".gp-btn--event");
        if (btnEl) {
          const pct = Math.round((1 - remainMs / totalMs) * 100);
          btnEl.style.setProperty("--cd-pct", `${pct}%`);
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
        dailyRow = `<div class="gp-goal gp-goal--active"><div class="gp-goal__head"><span class="gp-goal__title">📅 출석 보상 ${st.streak}일차</span><button class="gp-btn gp-btn--sm gp-btn--gold" data-action="claimAttendance">받기</button></div><div class="gp-goal__desc">해명 +${st.reward.explain} · 표 +${shortNumber(st.reward.votes)}${st.reward.seals ? " · 인장 +1" : ""}</div></div>`;
      }
    }
    const active = gs.nextQuest();
    const doneCount = questDefinitions.filter((q) => gs.data.quests[q.id]).length;

    const goalRow = (q, state) => {
      // state: "done" | "active" | "locked"
      const p = gs.questProgress(q);
      const ratio = Math.max(0, Math.min(1, p / q.target));
      const cls = state === "done" ? "gp-goal--done" : state === "active" ? "gp-goal--active" : "gp-goal--locked";
      const badge = state === "done" ? "✓" : state === "active" ? "진행" : "예정";
      return `<div class="gp-goal ${cls}">
        <div class="gp-goal__head"><span class="gp-goal__title">${q.title}</span><span class="gp-goal__badge">${badge}</span></div>
        <div class="gp-goal__desc">${q.desc}</div>
        <div class="gp-progress gp-goal__bar"><div class="gp-progress__fill" style="width:${(state === "done" ? 1 : ratio) * 100}%"></div></div>
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
      weeklyRow = `<div class="gp-goal gp-goal--weekly ${wclaimed ? "gp-goal--done" : wclaimable ? "gp-goal--active" : ""}">
        <div class="gp-goal__head"><span class="gp-goal__title">&#9733; ${wDef.title}</span>${wright}</div>
        <div class="gp-goal__desc">이번 주 표 ${shortNumber(wt)}장 처리</div>
        <div class="gp-progress gp-goal__bar"><div class="gp-progress__fill" style="width:${(wdone ? 1 : wratio) * 100}%"></div></div>
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
      return `<div class="gp-goal gp-goal--daily ${claimed ? "gp-goal--done" : claimable ? "gp-goal--active" : ""}">
        <div class="gp-goal__head"><span class="gp-goal__title">${q.title}</span>${right}</div>
        <div class="gp-goal__desc">${q.desc}</div>
        <div class="gp-progress gp-goal__bar"><div class="gp-progress__fill" style="width:${(done ? 1 : ratio) * 100}%"></div></div>
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
      return `<div class="gp-ach ${got ? "gp-ach--got" : ""}">
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
      ? `<button class="gp-btn gp-btn--sm gp-rankbtn" data-action="openRank">🏆 랭킹</button>` : "";
    this.panel.innerHTML = `<div class="gp-paneltitle">운영 목표 · ${titleProgress}${rankBtn}</div>
      <div class="gp-goallist-wrap"><div class="gp-stafflist gp-goallist">
      ${dailyRow}
      ${weeklyRow ? `<div class="gp-goal__section">&#9733; 주간 한정 · 일요일 종료</div>${weeklyRow}` : ""}
      <div class="gp-goal__section">&#9670; 일일 퀘스트 ${dailyClaimed}/${dailyQuestDefinitions.length} · 자정 초기화</div>${dailyRows}
      <div class="gp-goal__section">운영 목표</div>${questRows}
      <div class="gp-goal__section">업적 · ${gotCount}/${achievementDefinitions.length}</div>${achRows}</div><div class="gp-goallist-fade" aria-hidden="true"></div></div>`;
  }

  _renderPrestige() {
    const gs = this.gameState;
    const preview = gs.prestigePreview();
    const can = preview > 0;
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

    this.panel.innerHTML = `<div class="gp-paneltitle">감사 재정비 · 인장 ${gs.data.prestige.seals} · &#127894; 훈장 ${gs.data.prestige.medals} · 영구 x${fullMult.toFixed(2)}</div>
      ${this._renderCharacterCard()}
      ${this._renderGachaCard()}
      ${this._renderCosmeticCard()}
      <div class="gp-sealgrid">${ups}</div>
      ${detailCard}
      ${medalSection}
      <div class="gp-region"><span>예상 획득 +${preview}${gs.medalPreview() > 0 ? ` · &#127894;+${gs.medalPreview()}` : ""}</span><button class="gp-btn gp-btn--sm gp-btn--danger ${can ? "" : "gp-btn--disabled"}" data-action="prestigeReset">감사실행</button></div>`;

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
    const owned = gs.ownedTitleCount();
    const eq = gs.equippedTitleDef();
    const eqLv = eq ? (gs.data.titles[eq.id] || 0) : 0;
    const eqLine = eq
      ? `<span style="color:${RARITY_COLOR[eq.rarity]}">${eq.emoji} ${eq.name} Lv.${eqLv}</span> · ${eq.per}`
      : `<span class="gp-card__sub">아직 발령 없음 — 첫 뽑기로 칭호를 받으세요</span>`;
    // 보유 칭호 미니 칩(보유한 것만, 등급색)
    const chips = govTitles.filter((t) => (gs.data.titles[t.id] || 0) > 0)
      .map((t) => `<span class="gp-gacha__chip" style="border-color:${RARITY_COLOR[t.rarity]};color:${RARITY_COLOR[t.rarity]}" title="${t.name} · ${t.per}">${t.emoji}${(gs.data.titles[t.id] || 0)}</span>`)
      .join("");
    return `<div class="gp-gacha">
      <div class="gp-gacha__hd">🎰 인사 발령 뽑기 <span class="gp-gacha__count">보유 ${owned}/${govTitles.length}</span></div>
      <div class="gp-gacha__eq">${eqLine}</div>
      ${chips ? `<div class="gp-gacha__chips">${chips}</div>` : ""}
      <button class="gp-btn gp-btn--sm ${can ? "gp-btn--ready gp-btn--gold" : "gp-btn--disabled"}" data-action="drawGacha">뽑기 · 해명 ${shortNumber(cost)}</button>
    </div>`;
  }

  // 국장 캐릭터 선택 — 3종을 카드로(현재 선택=강조). 각자 외형+특성. 탭하면 변경(모든 리셋에도 유지).
  _renderCharacterCard() {
    const gs = this.gameState;
    const cur = gs.currentCharacter ? gs.currentCharacter().id : "classic";
    const opts = characters.map((c) => {
      const on = c.id === cur;
      return `<button class="gp-char__opt ${on ? "gp-char__opt--on" : ""}" data-action="selectChar" data-id="${c.id}">
        <span class="gp-char__emoji">${c.emoji}</span>
        <span class="gp-char__name">${c.name}</span>
        <span class="gp-char__trait">${c.traitText}</span>
      </button>`;
    }).join("");
    return `<div class="gp-gacha gp-charcard">
      <div class="gp-gacha__hd">🧑‍💼 국장 캐릭터</div>
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
      const chips = cosmetics.filter((c) => c.slot === slot).map((c) => {
        const has = gs.ownsCosmetic(c.id);
        if (!has) return `<span class="gp-cos__chip gp-cos__chip--lock" title="${c.name} · ${c.hint}">🔒</span>`;
        const on = eq === c.id;
        return `<button class="gp-cos__chip ${on ? "gp-cos__chip--on" : ""}" data-action="equipCos" data-id="${c.id}" title="${c.name}${on ? " (장착중·탭하면 벗기)" : ""}">${c.emoji}</button>`;
      }).join("");
      return `<div class="gp-cos__row"><span class="gp-cos__slot">${slotLabel[slot] || slot}</span><div class="gp-cos__chips">${chips || "—"}</div></div>`;
    }).join("");
    return `<div class="gp-gacha gp-cos">
      <div class="gp-gacha__hd">🎩 국장 꾸미기 <span class="gp-gacha__count">보유 ${owned}/${cosmetics.length}</span></div>
      ${rows}
      <div class="gp-cos__tip">진행하면 더 해금돼요 · 탭해서 장착/해제</div>
    </div>`;
  }

  // 훈장(2차 통화) 전당 — 인장 트리와 시각·경제를 구분(금색 강조). 미해금 시엔 획득법 안내만 노출.
  _renderMedalSection() {
    const gs = this.gameState;
    const unlocked = (gs.data.prestige.totalMedals || 0) > 0 || (gs.data.prestige.medals || 0) > 0;
    if (!unlocked) {
      return `<div class="gp-goal__section" style="margin-top:10px">&#127894; 훈장 전당 · 2차</div>
        <div class="gp-card__sub" style="padding:2px 4px 0;opacity:.78">새 구역을 처음 돌파하면 <b>훈장</b>을 얻어 영구 메타 강화를 해금합니다.</div>`;
    }
    const medalFirst = medalUpgrades.find((u) => {
      const lv = gs.prestigeUpgradeLevel(u.id);
      return gs.data.prestige.medals >= gs.prestigeUpgradeCost(u.id) && lv < u.maxLevel;
    });
    if (!this._selectedMedal) this._selectedMedal = medalFirst?.id || medalUpgrades[0]?.id;
    const sel = this._selectedMedal;
    const selDef = medalUpgrades.find((u) => u.id === sel);
    const selLv = selDef ? gs.prestigeUpgradeLevel(sel) : 0;
    const selCost = selDef ? gs.prestigeUpgradeCost(sel) : 0;
    const selCanBuy = selDef && gs.data.prestige.medals >= selCost && selLv < selDef.maxLevel;

    const grid = medalUpgrades.map((u) => {
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
        <div class="gp-card__gain">비용: &#127894; 훈장 ${selCost}</div>
      </div>
      <button class="gp-btn gp-btn--sm gp-btn--gold ${selCanBuy ? "gp-btn--ready" : "gp-btn--disabled"}" data-action="buyPrestige" data-id="${sel}">구매</button>
    </div>` : "";

    return `<div class="gp-goal__section" style="margin-top:10px">&#127894; 훈장 전당 · 2차 · 보유 ${gs.data.prestige.medals}</div>
      <div class="gp-sealgrid">${grid}</div>
      ${detail}`;
  }
}
