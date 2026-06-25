import { shortNumber } from "../utils/format.js";
import { facilities } from "../data/facilities.js";
import { staffDefinitions, rarityColors } from "../data/staff.js";
import { officeEvents } from "../data/events.js";
import { prestigeUpgrades } from "../data/prestige.js";
import { questDefinitions } from "../data/quests.js";
import { achievementDefinitions } from "../data/achievements.js";

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
    this.root = document.createElement("div");
    this.root.className = "gp-bottom";
    this.root.innerHTML = `<div class="gp-panel" data-k="panel"></div><div class="gp-tabs" data-k="tabs"></div>`;

    const tabsEl = this.root.querySelector('[data-k="tabs"]');
    TABS.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.className = "gp-tab";
      b.dataset.tab = id;
      b.innerHTML = `${label}<span class="gp-tab__dot" data-dot="${id}" hidden></span>`;
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
  }

  destroy() {
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
      case "upgradeFac": gs.upgrade(gs.data.selected); break;
      case "advanceStage": gs.advanceStage(); break;
      case "hire": gs.hireStaff(id); break;
      case "getEvent": if (gs.eventReady()) { this.currentEvent = this._pickEvent(); this.refresh(); } break;
      case "eventChoice": {
        const ev = officeEvents.find((v) => v.id === id);
        if (ev) gs.applyEffect((el.dataset.side === "left" ? ev.left : ev.right)[1]);
        document.dispatchEvent(new CustomEvent("gp:event-resolved"));
        this.currentEvent = null;
        this.refresh();
        break;
      }
      case "buyPrestige": gs.buyPrestigeUpgrade(id); break;
      case "prestigeReset": document.dispatchEvent(new CustomEvent("gp:prestige-confirm")); break;
    }
  }

  _pickEvent() {
    const avail = officeEvents.filter((ev) => this.gameState.data.stage.area >= (ev.minStage || 1));
    if (!avail.length) return null;
    // 데이터에 정의된 weight를 반영한 가중 추첨(희귀 사건이 흔한 사건과 동일 확률로 뜨던 버그 수정)
    const total = avail.reduce((s, ev) => s + (ev.weight || 1), 0);
    let roll = Math.random() * total;
    for (const ev of avail) {
      roll -= ev.weight || 1;
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
    const eventDot = this.root.querySelector('[data-dot="events"]');
    if (eventDot) eventDot.hidden = !(this.gameState.eventReady() && activeTab !== "events");
  }

  _renderFacilities() {
    const gs = this.gameState;
    const sel = gs.facility(gs.data.selected) ? gs.data.selected : "desk";
    const f = gs.facility(sel);
    const unlocked = gs.isUnlocked(sel);
    const cost = gs.cost(sel);
    const ex = gs.explainCost(sel);
    const canBuy = unlocked && gs.data.votes >= cost && gs.data.explain >= ex;
    const stageDone = gs.data.stage.progress >= gs.data.stage.target;
    // FIX #4: two-line upgrade button — verb on top, cost below — prevents truncation at any number length
    const upgradeBtn = unlocked
      ? `<button class="gp-btn gp-btn--gold gp-btn--upgrade ${canBuy ? "" : "gp-btn--disabled"}" data-action="upgradeFac">업그레이드<small>${shortNumber(cost)}표</small></button>`
      : `<button class="gp-btn gp-btn--upgrade gp-btn--disabled" data-action="upgradeFac">잠김</button>`;
    this.panel.innerHTML = `
      <div class="gp-card">
        <div class="gp-card__icon" style="background-image:url('/art/${sel}-t1.webp');background-color:${hex(f.color)}"></div>
        <div class="gp-card__body">
          <div class="gp-card__title">${f.name} Lv.${gs.level(sel)}</div>
          <div class="gp-card__sub">${unlocked ? `${shortNumber(cost)}표 · 해명 ${shortNumber(ex)}` : `${f.unlock}구역에서 해금`}</div>
          ${unlocked ? `<div class="gp-card__gain">▲ 업그레이드 시 초당 +${f.cps}표</div>` : ""}
        </div>
        ${upgradeBtn}
      </div>
      <div class="gp-facsel">${facilities.map((ff) => {
        const u = gs.isUnlocked(ff.id);
        return `<button class="gp-fac ${ff.id === sel ? "gp-fac--active" : ""} ${u ? "" : "gp-fac--locked"}" data-action="selectFac" data-id="${ff.id}"><span class="gp-fac__icon" style="background:${hex(ff.color)}"></span><span class="gp-fac__role">${ff.role}</span><span class="gp-fac__lv">${u ? `Lv.${gs.level(ff.id)}` : `${ff.unlock}구`}</span></button>`;
      }).join("")}</div>
      <div class="gp-region"><span>${gs.data.stage.area}구역 · ${shortNumber(gs.data.stage.progress)} / ${shortNumber(gs.data.stage.target)}</span>${
        stageDone
          ? `<button class="gp-btn gp-btn--sm" data-action="advanceStage">지역완료 ✓</button>`
          : `<span class="gp-stage-frac">${Math.floor((gs.data.stage.progress / gs.data.stage.target) * 100)}%</span>`
      }</div>`;
  }

  _renderCrew() {
    const gs = this.gameState;
    const cards = staffDefinitions.map((s) => {
      const lv = gs.staffLevel(s.id);
      const cost = gs.staffCost(s.id);
      const ex = gs.staffExplainCost(s.id);
      const can = gs.data.votes >= cost && gs.data.explain >= ex;
      const skill = s.skill ? (gs.staffSkillActive(s.id) ? s.skill.name : `스킬 Lv.${s.skill.unlockLevel}`) : "";
      return `<div class="gp-staff" style="--rarity-color:${hex(rarityColors[s.rarity] || 0xd8c4a0)}">
        <div class="gp-staff__dot" style="background:${hex(s.color)}"></div>
        <div class="gp-staff__body"><div class="gp-staff__name">${s.name}<span class="gp-staff__rar">${s.rarityName}</span></div><div class="gp-staff__sub">Lv.${lv} · ${skill}</div></div>
        <button class="gp-btn gp-btn--sm ${can ? "" : "gp-btn--disabled"}" data-action="hire" data-id="${s.id}">${shortNumber(cost)}표</button></div>`;
    }).join("");
    // Scroll fade is a real div (not ::after) for reliable WebView support
    this.panel.innerHTML = `<div class="gp-paneltitle">직원 채용 · 생산 x${gs.staffMultiplierFor(gs.data).toFixed(2)}</div><div class="gp-stafflist-wrap"><div class="gp-stafflist">${cards}</div><div class="gp-stafflist-fade" aria-hidden="true"></div></div>`;
  }

  _renderEvents() {
    const gs = this.gameState;
    const ev = this.currentEvent;
    if (ev) {
      this.panel.innerHTML = `<div class="gp-event"><div class="gp-event__title">${ev.title}</div><div class="gp-event__body">${ev.body}</div>
        <div class="gp-event__choices">
          <button class="gp-btn gp-event__c" data-action="eventChoice" data-id="${ev.id}" data-side="left">${ev.left[0]}<small>${ev.left[2]}</small></button>
          <button class="gp-btn gp-event__c" data-action="eventChoice" data-id="${ev.id}" data-side="right">${ev.right[0]}<small>${ev.right[2]}</small></button>
        </div></div>`;
    } else {
      const log = (gs.data.log || []).slice(0, 3).map((l) => `<div class="gp-logline">${l}</div>`).join("");
      const ready = gs.eventReady();
      const sec = Math.ceil(gs.eventCooldownRemainingMs() / 1000);
      const btn = ready
        ? `<button class="gp-btn gp-btn--event" data-action="getEvent">사건 받기</button>`
        : `<button class="gp-btn gp-btn--event gp-btn--disabled" data-action="getEvent">다음 사건까지 ${sec}초</button>`;
      this.panel.innerHTML = `<div class="gp-paneltitle">📋 사건 대응실 · 처리 ${gs.data.stats.totalEvents}건</div><div class="gp-card__sub">사건 대응으로 표·믿음을 얻으세요 · 보상 x${gs.eventRewardScale().toFixed(1)}</div>${btn}<div class="gp-log">${log}</div>`;
    }
  }

  _renderGoals() {
    const gs = this.gameState;
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

    let questRows = questDefinitions.map((q) =>
      goalRow(q, gs.data.quests[q.id] ? "done" : (active && q.id === active.id ? "active" : "locked"))
    ).join("");
    // 정의된 목표를 모두 완료하면 끝없는 누적-표 목표를 현재 진행 목표로 노출
    if (active && active.generated) questRows += goalRow(active, "active");

    const achRows = achievementDefinitions.map((a) => {
      const got = !!gs.data.achievements[a.id];
      const cur = gs.achievementProgress(a.metric);
      const ratio = Math.max(0, Math.min(1, cur / a.target));
      return `<div class="gp-ach ${got ? "gp-ach--got" : ""}">
        <span class="gp-ach__medal">${got ? "🏅" : "🔒"}</span>
        <span class="gp-ach__body"><span class="gp-ach__name">${a.name}</span><span class="gp-ach__desc">${got ? a.desc : `${a.desc} (${Math.floor(ratio * 100)}%)`}</span></span>
      </div>`;
    }).join("");
    const gotCount = achievementDefinitions.filter((a) => gs.data.achievements[a.id]).length;

    const titleProgress = active && active.generated
      ? `정규 완료 · 끝없는 목표 ${gs.data.endless + 1}단계`
      : `${doneCount}/${questDefinitions.length} 완료`;
    this.panel.innerHTML = `<div class="gp-paneltitle">운영 목표 · ${titleProgress}</div>
      <div class="gp-stafflist gp-goallist">${questRows}
      <div class="gp-goal__section">업적 · ${gotCount}/${achievementDefinitions.length}</div>${achRows}</div>`;
  }

  _renderPrestige() {
    const gs = this.gameState;
    const preview = gs.prestigePreview();
    const can = preview > 0;
    // FIX #8: prestige upgrades use .gp-seal (gem-blue) not .gp-fac (gold) — distinct economy, distinct look
    const ups = prestigeUpgrades.map((u) => {
      const lv = gs.prestigeUpgradeLevel(u.id);
      const cost = gs.prestigeUpgradeCost(u.id);
      const cb = gs.data.prestige.seals >= cost && lv < u.maxLevel;
      return `<button class="gp-seal ${cb ? "" : "gp-seal--locked"}" data-action="buyPrestige" data-id="${u.id}"><span class="gp-seal__role">${u.shortName}</span><span class="gp-seal__lv">Lv.${lv} · ${cost}</span></button>`;
    }).join("");
    const fullMult = gs.prestigeMultiplierFor(gs.data) * (1 + (gs.permanentEffectFor ? gs.permanentEffectFor(gs.data, "cpsPct") : 0));
    this.panel.innerHTML = `<div class="gp-paneltitle">감사 재정비 · 인장 ${gs.data.prestige.seals} · 영구 x${fullMult.toFixed(2)}</div>
      <div class="gp-sealgrid">${ups}</div>
      <div class="gp-region"><span>예상 획득 +${preview}</span><button class="gp-btn gp-btn--sm gp-btn--danger ${can ? "" : "gp-btn--disabled"}" data-action="prestigeReset">감사실행</button></div>`;
  }
}
