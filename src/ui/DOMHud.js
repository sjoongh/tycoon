import { shortNumber } from "../utils/format.js";
import { iconHtml, iconStyle } from "./icon.js";

export class DOMHud {
  constructor(gameState, notifications = null) {
    this.gameState = gameState;
    this.notifications = notifications;
    this.root = document.createElement("div");
    this.root.className = "gp-hud";
    this.root.innerHTML = `
      <div class="gp-hud__row">
        <div class="gp-chip gp-chip--votes"><span class="gp-chip__ic" style="${iconStyle("res-votes", 1)}"></span><span><div class="gp-chip__label">표</div><div class="gp-chip__val" data-k="votes">0</div></span></div>
        <div class="gp-chip gp-chip--explain"><span class="gp-chip__ic" style="${iconStyle("res-explain", 1)}"></span><span><div class="gp-chip__label">해명</div><div class="gp-chip__val" data-k="explain">0</div></span></div>
        <div class="gp-chip gp-chip--trust"><span class="gp-chip__ic" style="${iconStyle("res-trust", 1)}"></span><span><div class="gp-chip__label">믿음</div><div class="gp-chip__val" data-k="trust">0%</div></span></div>
      </div>
      <div class="gp-progress"><div class="gp-progress__fill" data-k="progress"></div></div>
      <div class="gp-stage" data-k="stage"></div>
      <button type="button" class="gp-fever" data-k="fever" hidden>
        <div class="gp-fever__fill" data-k="fever-fill"></div>
        <div class="gp-fever__text"><span data-k="fever-label">작전 열기</span><b data-k="fever-value">0%</b></div>
        <small class="gp-fever__hint">눌러서 작전 현황 보기</small>
      </button>
      <div class="gp-truststate" data-k="truststate" hidden></div>
      <div class="gp-commgauge" data-k="commgauge" hidden><div class="gp-commgauge__fill"></div><span class="gp-commgauge__txt"></span></div>
      <div class="gp-backlog" data-k="backlog" hidden><span class="gp-backlog__txt"></span></div>`;
    this._els = {
      votes: this.root.querySelector('[data-k="votes"]'),
      explain: this.root.querySelector('[data-k="explain"]'),
      trust: this.root.querySelector('[data-k="trust"]'),
      progress: this.root.querySelector('[data-k="progress"]'),
      trustChip: this.root.querySelector(".gp-chip--trust"),
      trustState: this.root.querySelector('[data-k="truststate"]'),
      stage: this.root.querySelector('[data-k="stage"]'),
      commGauge: this.root.querySelector('[data-k="commgauge"]'),
      commFill: this.root.querySelector(".gp-commgauge__fill"),
      commText: this.root.querySelector(".gp-commgauge__txt"),
      backlog: this.root.querySelector('[data-k="backlog"]'),
      backlogText: this.root.querySelector(".gp-backlog__txt"),
      fever: this.root.querySelector('[data-k="fever"]'),
      feverFill: this.root.querySelector('[data-k="fever-fill"]'),
      feverLabel: this.root.querySelector('[data-k="fever-label"]'),
      feverHint: this.root.querySelector(".gp-fever__hint"),
      feverValue: this.root.querySelector('[data-k="fever-value"]'),
    };
    this._stageMarkup = "";
    this._briefMarkupKey = "";
    this._rushMarkupKey = "";
    this._refresh = () => this.refresh();
    this._els.fever.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("gp:open-operations"));
    });
    // FIX #1: mute button created separately so it mounts on .gp-ui root (above HUD),
    // preventing overlap with the 믿음 chip on the right side.
    this._muteBtn = document.createElement("button");
    this._muteBtn.className = "gp-mute";
    this._muteBtn.setAttribute("aria-label", "설정");
    this._muteBtn.innerHTML = iconHtml("ui-gear", { scale: 1 });
    this._muteBtn.addEventListener("click", () => document.dispatchEvent(new CustomEvent("gp:open-settings")));

    // 긴급 개표는 독립 버프가 아니라 피버 마지막 4초의 1회 피니셔다.
    this._rushBtn = document.createElement("button");
    this._rushBtn.className = "gp-rush";
    this._rushBtn.addEventListener("click", () => {
      const wasReady = this.gameState.feverFinisherAvailable && this.gameState.feverFinisherAvailable();
      if (this.gameState.activateFeverFinisher) this.gameState.activateFeverFinisher();
      if (wasReady) document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "powerup" }));
    });

    // 긴급 브리핑 FAB(좌측) — 해명 소비 → 믿음 회복 + 생산 버프(액티브 트러스트 관리)
    this._briefBtn = document.createElement("button");
    this._briefBtn.className = "gp-brief";
    this._briefBtn.addEventListener("click", () => {
      const wasReady = this.gameState.briefReady && this.gameState.briefReady() && this.gameState.briefAffordable && this.gameState.briefAffordable();
      if (this.gameState.activateBrief) this.gameState.activateBrief();
      if (wasReady) document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "powerup" }));
    });

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
    this._setText(this._els.votes, shortNumber(d.votes));
    this._setText(this._els.explain, shortNumber(d.explain));
    this._setText(this._els.trust, `${Math.round(d.trust)}%`);
    const ratio = Math.max(0, Math.min(1, d.stage.progress / d.stage.target));
    this._setStyle(this._els.progress, "transform", `scaleX(${ratio})`);

    // 믿음 위기/보너스 상태를 믿음 칩과 상태 배지로 노출(테마 시그니처)
    const state = this.gameState.trustState ? this.gameState.trustState() : "normal";
    const chip = this._els.trustChip;
    chip.classList.toggle("gp-chip--crisis", state === "crisis");
    chip.classList.toggle("gp-chip--bonus", state === "bonus");
    // P1 fix: collapse trust-state badge into .gp-stage pill (saves ~26px HUD height)
    // The separate .gp-truststate row is hidden; inline suffix signals state at zero cost.
    const badge = this._els.trustState;
    badge.hidden = true;
    const stageEl = this._els.stage;
    const stateSuffix = state === "crisis"
      ? ` · <span style="color:#ff9a9a">▼ 불신위기</span>`
      : state === "bonus"
      ? ` · <span style="color:#8df0b0">▲ 신뢰보너스</span>`
      : "";
    // 초당 생산은 월드 하단에 상시 노출되므로 HUD에는 진행 맥락만 남긴다.
    const stageMarkup = `${d.stage.area}구역 · D-${d.days}${stateSuffix}`;
    if (stageMarkup !== this._stageMarkup) {
      this._stageMarkup = stageMarkup;
      stageEl.innerHTML = stageMarkup;
    }

    // 적체 경고 — 유입이 용량을 넘겨 미처리 표가 쌓이면 노출
    const bEl = this._els.backlog;
    if (bEl) {
      const backlog = Math.max(0, d.backlog || 0);
      if (backlog >= 1) {
        bEl.hidden = false;
        const pen = this.gameState.backlogTrustPenalty ? this.gameState.backlogTrustPenalty() : 0;
        this._setText(this._els.backlogText, `적체 ${shortNumber(backlog)}표 · 믿음 -${(pen * 60).toFixed(1)}/분 · 분류·기록 용량 부족`);
        bEl.classList.toggle("gp-backlog--danger", pen >= 0.05);
      } else {
        bEl.hidden = true;
      }
    }

    // 공산화(체제 전복) 위험 게이지 — 위험이 쌓일 때만 노출(미리 보이게 = 공정)
    const gauge = this.gameState.commGaugePct ? this.gameState.commGaugePct() : 0;
    const gEl = this._els.commGauge;
    if (gEl) {
      if (gauge > 0) {
        gEl.hidden = false;
        this._setStyle(this._els.commFill, "transform", `scaleX(${gauge})`);
        this._setText(this._els.commText, `체제 전복 위기 ${Math.round(gauge * 100)}%`);
        gEl.classList.toggle("gp-commgauge--danger", gauge >= 0.66);
      } else {
        gEl.hidden = true;
      }
    }

    this._refreshRush();
    this._refreshBrief();
    this._refreshFever();
  }

  _setText(element, value) {
    const text = String(value);
    if (element.textContent !== text) element.textContent = text;
  }

  _setStyle(element, property, value) {
    if (element.style[property] !== value) element.style[property] = value;
  }

  _refreshFever() {
    const gs = this.gameState;
    const fever = this._els.fever;
    const game = document.getElementById("game");
    if (!fever || !gs.feverUnlocked || !gs.feverUnlocked()) {
      if (fever) fever.hidden = true;
      game?.classList.remove("gp-game--fever");
      return;
    }

    fever.hidden = false;
    const active = gs.feverActive();
    const recovering = gs.feverRecovering ? gs.feverRecovering() : false;
    const pct = Math.max(0, Math.min(1, gs.feverProgressPct()));
    const profile = gs.feverProfile ? gs.feverProfile() : { icon: "op-fire", name: "개표 피버", summary: "생산·탭 강화" };
    fever.classList.toggle("gp-fever--active", active);
    fever.classList.toggle("gp-fever--recovery", recovering);
    ["tap", "build", "response"].forEach((family) => {
      fever.classList.toggle(`gp-fever--${family}`, gs.feverFamily && gs.feverFamily() === family);
    });
    this._setStyle(this._els.feverFill, "transform", `scaleX(${pct})`);
    this._setText(this._els.feverLabel, active
      ? `${profile.name}`
      : recovering
        ? "재정비 중"
        : `${profile.name} 열기`);
    this._setText(this._els.feverHint, active
      ? `${profile.summary} · 눌러서 작전 현황`
      : recovering
        ? "열기 충전 대기 · 눌러서 작전 현황"
        : "행동으로 충전 · 눌러서 작전 현황");
    this._setText(this._els.feverValue, active
      ? `${Math.max(1, Math.ceil(gs.feverRemainingMs() / 1000))}초`
      : recovering
        ? `${Math.max(1, Math.ceil(gs.feverRecoveryRemainingMs() / 1000))}초`
        : `${Math.round(gs.feverCharge())}%`);
    const ariaLabel = active
      ? `${profile.name} 발동 중, ${Math.ceil(gs.feverRemainingMs() / 1000)}초 남음. 작전 현황 보기`
      : recovering
        ? `피버 재정비 ${Math.ceil(gs.feverRecoveryRemainingMs() / 1000)}초 남음. 작전 현황 보기`
        : `${profile.name} 열기 ${Math.round(gs.feverCharge())}퍼센트. 작전 현황 보기`;
    if (fever.getAttribute("aria-label") !== ariaLabel) fever.setAttribute("aria-label", ariaLabel);
    game?.classList.toggle("gp-game--fever", active);
  }

  // 탭 학습 단계(첫 업그레이드 전)에는 액티브 FAB 숨김 — 첫 60초 CTA 과부하 방지
  _fabsHidden() {
    const d = this.gameState.data;
    return !d.tutorial?.done && (d.stats?.totalUpgrades || 0) < 1;
  }

  _refreshBrief() {
    const gs = this.gameState;
    if (!gs.briefReady) return;
    const btn = this._briefBtn;
    const hidden = this._fabsHidden();
    this._setStyle(btn, "display", hidden ? "none" : "flex");
    if (hidden) return;
    let className;
    let disabled;
    let html;
    if (gs.briefActive()) {
      className = "gp-brief gp-brief--active";
      disabled = true;
      html = `<b>브리핑 효과</b><small>×1.5 · ${Math.ceil(gs.briefRemainingMs() / 1000)}초</small>`;
    } else if (!gs.briefReady()) {
      className = "gp-brief gp-brief--cd";
      disabled = true;
      html = `<b>재정비 중</b><small>${Math.ceil(gs.briefCooldownRemainingMs() / 1000)}초</small>`;
    } else if (!gs.briefAffordable()) {
      className = "gp-brief gp-brief--poor";
      disabled = true;
      html = `<b>긴급 브리핑</b><small>해명 ${shortNumber(gs.briefCost())} 필요</small>`;
    } else {
      className = "gp-brief gp-brief--ready";
      disabled = false;
      html = `<b>긴급 브리핑</b><small>해명 ${shortNumber(gs.briefCost())} · 믿음+12</small>`;
    }
    const markupKey = `${className}|${disabled}|${html}`;
    if (markupKey !== this._briefMarkupKey) {
      this._briefMarkupKey = markupKey;
      btn.className = className;
      btn.disabled = disabled;
      btn.innerHTML = html;
    }
  }

  _refreshRush() {
    const gs = this.gameState;
    if (!gs.feverFinisherAvailable) return;
    const btn = this._rushBtn;
    const hidden = this._fabsHidden() || !gs.feverActive() || (!gs.feverFinisherAvailable() && !gs.feverFinisherUsed());
    this._setStyle(btn, "display", hidden ? "none" : "flex");
    if (hidden) return;
    const remMs = gs.feverRemainingMs();
    let className;
    let disabled;
    let html;
    if (gs.feverFinisherUsed()) {
      className = "gp-rush gp-rush--active";
      disabled = true;
      const rushPct = Math.round(Math.max(0, Math.min(100, (remMs / gs.feverFinisherWindowMs()) * 100)));
      if (btn.style.getPropertyValue("--rush-pct") !== `${rushPct}%`) btn.style.setProperty("--rush-pct", `${rushPct}%`);
      html = `<b>막판 총력!</b><small>추가 ×2 · ${Math.ceil(remMs / 1000)}초</small>`;
    } else {
      className = "gp-rush gp-rush--ready";
      disabled = false;
      btn.style.removeProperty("--rush-pct");
      html = `<b>막판 총력</b><small>남은 피버 추가 ×2</small>`;
    }
    const markupKey = `${className}|${disabled}|${html}`;
    if (markupKey !== this._rushMarkupKey) {
      this._rushMarkupKey = markupKey;
      btn.className = className;
      btn.disabled = disabled;
      btn.innerHTML = html;
    }
  }

  destroy() {
    this.gameState.off("changed", this._refresh);
    this._muteBtn.remove();
    this._rushBtn.remove();
    this._briefBtn.remove();
    document.getElementById("game")?.classList.remove("gp-game--fever");
    this.root.remove();
  }
}
