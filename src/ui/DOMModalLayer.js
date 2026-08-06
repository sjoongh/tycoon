import { shortNumber } from "../utils/format.js";
import { GOV_MAPS, PROP_MAPS, dotSvgUri } from "../world/dotChar.js";
import { RARITY_LABEL, RARITY_COLOR } from "../data/titles.js";
import { FEVER_FAMILY_PROFILES, OPERATION_FAMILIES, operationDefinitions } from "../data/operations.js";
import { BOSS_DURATION_MS } from "../data/bosses.js";

const MILESTONES = [5, 10, 25, 45];

// 오프라인 보상 모달 + 마일스톤 연출 + 신규 온보딩 힌트
export class DOMModalLayer {
  constructor(gameState, notifications = null) {
    this.gameState = gameState;
    this.notifications = notifications;
    this.root = document.createElement("div");
    this.root.className = "gp-modal-layer";
    this._hint = null;
    this._prevArea = gameState.data.stage.area;
    this._onUpgraded = (f) => this._checkMilestone(f);
    this._onChanged = () => { this._maybeHint(); this._checkStage(); this._maybeBossChallenge(); this._maybeOperationDraft(); this._maybeFeverReport(); this._maybeNotifPrompt(); };
    this._onPrestigeConfirm = () => this._confirmPrestige();
    this._onCelebrate = (p) => {
      this._banner(p.text, { priority: 2, tone: "reward" });
      if (!this.gameState.bossActive?.() && !this._bossEl?.isConnected) this._flash();
    };
    this._onGachaResult = (e) => this._showGachaResult(e.detail);
    this._onGachaResult10 = (e) => this._showGachaResult10(e.detail);
    this._onCommWarning = (p) => { this._banner(p.text, { priority: 4, tone: "danger" }); document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "crisis" })); };
    this._onCommCollapse = (p) => this._showCollapse(p);
    this._onOpenOperations = () => this._showOperationStatus();
    this._onBossStart = (result) => this._showBossChallenge(result);
    this._onBossEnd = (result) => this._resolveBossChallenge(result);
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.gameState.on("upgraded", this._onUpgraded);
    this.gameState.on("changed", this._onChanged);
    this.gameState.on("celebrate", this._onCelebrate);
    this.gameState.on("comm-warning", this._onCommWarning);
    this.gameState.on("comm-collapse", this._onCommCollapse);
    this.gameState.on("boss-start", this._onBossStart);
    this.gameState.on("boss-end", this._onBossEnd);
    document.addEventListener("gp:prestige-confirm", this._onPrestigeConfirm);
    document.addEventListener("gp:gacha-result", this._onGachaResult);
    document.addEventListener("gp:gacha-result10", this._onGachaResult10);
    document.addEventListener("gp:open-operations", this._onOpenOperations);
    if (!this._maybeOpening()) {
      // 오프라인 정산을 먼저 보여주고, 닫은 뒤에 출석 보상(겹쳐 가려지지 않게 체인)
      if (this.gameState.offlineReward) this._showOfflineReward(() => this._maybeDaily());
      else this._maybeDaily();
    }
    this._maybeHint();
    this._maybeBossChallenge();
    this._maybeOperationDraft();
  }

  // 10연차 결과 — 등급색 리스트로 한 번에(신규는 🎉, 중복은 Lv 승진 표시)
  _showGachaResult10(list) {
    if (!list || !list.length) return;
    const COLOR = { common: "#d8c4a0", uncommon: "#7fd9a0", rare: "#ffcd75" };
    const rows = list.map((r) => `<div class="gp-g10__row" style="color:${COLOR[r.rarity] || "#fff"}">${r.emoji} ${r.name} ${r.isNew ? "🎉신규" : `Lv.${r.level}`}</div>`).join("");
    this._openModal(`
      <div class="gp-modal__badge">🎰</div>
      <div class="gp-mtitle">${list.length}연차 결과</div>
      <div class="gp-g10">${rows}</div>
      <button class="gp-btn gp-btn--gold" data-confirm>확인</button>`);
    document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "achieve" }));
  }

  // 일일 출석 보상: 신규 첫 세션(오프닝)에는 건너뛰고 재방문부터 노출
  _maybeDaily() {
    const gs = this.gameState;
    if (!gs.dailyStatus) return;
    const st = gs.dailyStatus();
    if (!st.available) return;
    const r = st.reward;
    const sealLine = r.seals ? `<br><span>+${r.seals} 제도인장</span>` : "";
    this._openModal(`
      <div class="gp-modal__badge">📅</div>
      <div class="gp-mtitle">출석 보상 · ${st.streak}일 연속</div>
      <div class="gp-msub">매일 들러 개표국을 챙기세요${st.streak >= 7 ? " (최대 연속!)" : ""}</div>
      <div class="gp-mbig">+${shortNumber(r.votes)}표<br><span>+${shortNumber(r.explain)} 해명</span>${sealLine}</div>
      <button class="gp-btn gp-btn--gold" data-confirm>받기</button>`, () => gs.claimDaily());
  }

  // 신규 첫 세션 오프닝(3카드). 보여줬으면 true 반환(오프라인 보상은 다음 세션부터).
  _maybeOpening() {
    const d = this.gameState.data;
    // openingSeen 영구 플래그로 한 번만 노출(첫 탭 전 새로고침 시 매번 재표시되던 버그 수정)
    const fresh = !d.tutorial?.done && !d.tutorial?.openingSeen && (d.stats.totalClicks || 0) === 0 && d.stage.area === 1 && d.stage.progress === 0;
    if (!fresh) return false;
    if (d.tutorial) d.tutorial.openingSeen = true;
    this.gameState.save && this.gameState.save(false);
    const cards = [
      { art: dotSvgUri(GOV_MAPS[0]), t: "믿어주세요, 개표국", s: "오늘부터 당신이 개표국장입니다. 믿음도 바닥, 서류도 엉망. 밑바닥에서 시작합니다." },
      { art: dotSvgUri(PROP_MAPS["prop-sorter"]), t: "표를 처리하라", s: "화면을 탭해 표를 처리하고, 시설을 키우고, 직원을 채용하세요. 해명 서류는 사건 대응·브리핑·뽑기에 쓰는 두 번째 자원입니다." },
      { art: dotSvgUri(PROP_MAPS["prop-board"]), t: "사건에 대응하라", s: "터지는 사건마다 믿음이 걸려 있습니다. 전국이 지켜봅니다. 자, 분류 시작!" },
    ];
    let i = 0;
    const ov = document.createElement("div");
    ov.className = "gp-modal-ov";
    const render = () => {
      const c = cards[i];
      const dots = cards.map((_, idx) => `<span class="gp-dot${idx === i ? " gp-dot--on" : ""}"></span>`).join("");
      const last = i >= cards.length - 1;
      ov.innerHTML = `<div class="gp-modal">
        <div class="gp-modal__art" style="background-image:url('${c.art}')"></div>
        <div class="gp-mtitle">${c.t}</div>
        <div class="gp-msub">${c.s}</div>
        <div class="gp-dots">${dots}</div>
        <button class="gp-btn gp-btn--gold" data-next>${last ? "분류 시작!" : "다음"}</button>
        ${last ? "" : `<button class="gp-skip" data-skip>건너뛰기</button>`}
        <div class="gp-disclaimer">※ 본 게임은 창작 픽션입니다. 등장하는 기관·사건·인물은 실존과 무관하며 특정 대상을 비방할 의도가 없습니다. 일부는 공개된 사회 이슈에서 영감받아 위트있게 각색했습니다.</div>
      </div>`;
    };
    ov.addEventListener("click", (e) => {
      if (e.target.closest("[data-skip]")) { ov.remove(); this._drainBanners(); return; }
      if (!e.target.closest("[data-next]")) return;
      i += 1;
      if (i >= cards.length) { ov.remove(); this._drainBanners(); }
      else render();
    });
    render();
    this.root.appendChild(ov);
    return true;
  }

  _checkStage() {
    const a = this.gameState.data.stage.area;
    if (a > this._prevArea) {
      this._prevArea = a;
      this._banner(`${a}구역 진입!`, { priority: 3, tone: "stage" });
      this._flash();
    } else if (a < this._prevArea) {
      this._prevArea = a; // prestige reset
    }
  }

  _maybeBossChallenge() {
    if (!this.gameState.bossActive?.()) return;
    if (!this._bossEl?.isConnected) this._showBossChallenge({
      area: this.gameState.data.boss.area,
      definition: this.gameState.bossDefinition?.(),
      durationMs: BOSS_DURATION_MS,
    });
    this._updateBossChallenge();
  }

  _showBossChallenge(payload = {}) {
    if (this._bossMounting || this._bossEl?.isConnected || !this.gameState.bossActive?.()) return;
    this._bossMounting = true;
    this._clearActiveBanner({ requeue: true });
    clearTimeout(this._feverReportTimer);
    this._feverReportEl?.remove();
    this._feverReportEl = null;
    if (this.gameState.data.fever?.report) this.gameState.dismissFeverReport?.();
    this._clearHint();
    this._setCentralVisualActive(true);

    const definition = payload.definition || this.gameState.bossDefinition?.() || {};
    const area = payload.area || this.gameState.data.stage.area;
    const boss = document.createElement("section");
    boss.className = "gp-boss gp-boss--active";
    boss.setAttribute("role", "region");
    boss.setAttribute("aria-label", `${area}구역 ${definition.title || "최종 검증"}`);
    boss.innerHTML = `
      <div class="gp-boss__live" data-boss-live aria-live="polite" aria-atomic="true">${area}구역 최종 검증 시작. 제한 시간 8초.</div>
      <div class="gp-boss__head">
        <span class="gp-boss__icon" aria-hidden="true">${definition.icon || "⚠"}</span>
        <span class="gp-boss__heading"><small>${area}구역 체크포인트</small><b>${definition.title || "최종 검증"}</b></span>
        <strong class="gp-boss__time" data-boss-time>8초</strong>
      </div>
      <div class="gp-boss__desc" data-boss-desc>${definition.desc || "제한 시간 안에 처리력을 증명하세요."}</div>
      <div class="gp-boss__meter" aria-hidden="true"><span data-boss-fill></span></div>
      <div class="gp-boss__numbers"><span>처리량 <b data-boss-progress>0</b></span><em>화면 탭 + 초당 생산</em></div>
      <div class="gp-boss__timer" aria-hidden="true"><span data-boss-timer-fill></span></div>
      <button type="button" class="gp-boss__skip" data-boss-skip>기본 보상으로 완료</button>`;
    boss.querySelector("[data-boss-skip]").addEventListener("click", () => this.gameState.skipBoss?.());
    this._bossEl = boss;
    this.root.appendChild(boss);
    this._updateBossChallenge();
    clearInterval(this._bossClockTimer);
    this._bossClockTimer = setInterval(() => {
      if (this._destroyed || this._bossResolving) return;
      const result = this.gameState.syncBoss?.();
      if (!result) this._updateBossChallenge();
    }, 100);
    this._bossMounting = false;
    document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "crisis" }));
  }

  _updateBossChallenge(now = Date.now()) {
    const boss = this._bossEl;
    if (!boss?.isConnected || this._bossResolving) return;
    const state = this.gameState.data.boss;
    const progress = Math.max(0, state.progress || 0);
    const target = Math.max(1, state.target || 1);
    const pct = Math.min(1, progress / target);
    const remaining = this.gameState.bossRemainingMs?.(now) || 0;
    const remainingPct = Math.min(1, remaining / BOSS_DURATION_MS);
    boss.querySelector("[data-boss-fill]").style.transform = `scaleX(${pct})`;
    boss.querySelector("[data-boss-timer-fill]").style.transform = `scaleX(${remainingPct})`;
    boss.querySelector("[data-boss-progress]").textContent = `${shortNumber(progress)} / ${shortNumber(target)}`;
    boss.querySelector("[data-boss-time]").textContent = `${Math.max(0, Math.ceil(remaining / 1000))}초`;
  }

  _resolveBossChallenge(result) {
    if (!result || this._bossResolving) return;
    this._bossResolving = true;
    clearInterval(this._bossClockTimer);
    const boss = this._bossEl;
    if (boss?.isConnected) {
      boss.classList.remove("gp-boss--active");
      boss.classList.add(result.success ? "gp-boss--success" : "gp-boss--base");
      const title = boss.querySelector(".gp-boss__heading b");
      const desc = boss.querySelector("[data-boss-desc]");
      const time = boss.querySelector("[data-boss-time]");
      const progress = boss.querySelector("[data-boss-progress]");
      const timerFill = boss.querySelector("[data-boss-timer-fill]");
      const live = boss.querySelector("[data-boss-live]");
      const skip = boss.querySelector("[data-boss-skip]");
      if (title) title.textContent = result.success ? "정밀 검표 성공!" : result.outcome === "skipped" ? "기본 완료 선택" : "시간 종료";
      if (desc) desc.textContent = result.success
        ? `완료 보상 +${shortNumber(result.bonusVotes)}표 확보`
        : "페널티 없이 기본 구역 보상으로 진행합니다.";
      if (time) time.textContent = result.success ? "성공" : "완료";
      if (progress) progress.textContent = `${shortNumber(result.success ? result.target : result.progress)} / ${shortNumber(result.target)}`;
      if (timerFill) timerFill.style.transform = "scaleX(0)";
      if (live) live.textContent = result.success
        ? `최종 검증 성공. 완료 보상 ${shortNumber(result.bonusVotes)}표 추가.`
        : "최종 검증 기본 완료. 페널티 없이 진행합니다.";
      if (skip) skip.remove();
      if (result.success) {
        const fill = boss.querySelector("[data-boss-fill]");
        if (fill) fill.style.transform = "scaleX(1)";
        this._flash();
        document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "achieve" }));
      }
    }
    document.dispatchEvent(new CustomEvent("gp:boss-resolved", { detail: result }));
    clearTimeout(this._bossAdvanceTimer);
    this._bossAdvanceTimer = setTimeout(() => {
      this._bossEl?.remove();
      this._bossEl = null;
      this._bossResolving = false;
      this._setCentralVisualActive(false);
      const sameArea = this.gameState.data.stage.area === result.area;
      const ready = this.gameState.data.stage.progress >= this.gameState.data.stage.target;
      if (sameArea && ready && !this.gameState.bossRequired?.()) this.gameState.advanceStage();
      else this._drainBanners();
    }, 900);
  }

  // 3구역을 완료할 때마다 현장/운영/대응 3축 중 하나를 고르는 런 작전 드래프트.
  // 다른 보상 모달이 열려 있으면 다음 changed 틱까지 기다려 모달 중첩을 피한다.
  _maybeOperationDraft() {
    if (this._operationModal?.isConnected || this._bossEl?.isConnected || this.root.querySelector(".gp-modal-ov")) return;
    const draft = this.gameState.data.operations?.draft;
    const choices = this.gameState.operationDraftDefinitions ? this.gameState.operationDraftDefinitions() : [];
    if (!draft || choices.length !== 3) return;

    const cards = choices.map((operation) => {
      const level = this.gameState.operationLevel(operation.id);
      const family = OPERATION_FAMILIES[operation.family];
      const profile = FEVER_FAMILY_PROFILES[operation.family];
      const recommendation = this.gameState.operationRecommendationText?.(operation.family) || "";
      return `<button type="button" class="gp-opcard gp-opcard--${operation.family}" data-operation="${operation.id}" aria-pressed="false" aria-label="${operation.name} 레벨 ${level + 1} 선택">
        <span class="gp-opcard__icon" aria-hidden="true">${operation.icon}</span>
        <span class="gp-opcard__body">
          <span class="gp-opcard__meta"><span class="gp-opcard__family">${family?.label || "개표"} 작전</span>${recommendation ? `<em>★ 추천 · ${recommendation}</em>` : ""}</span>
          <b>${operation.name}</b>
          <small>${operation.benefit}</small>
          <span class="gp-opcard__detail">${operation.detail} · ${profile.name}</span>
        </span>
        <span class="gp-opcard__level">Lv.${level}<i>→ ${level + 1}</i></span>
      </button>`;
    }).join("");

    const ov = document.createElement("div");
    ov.className = "gp-modal-ov";
    ov.innerHTML = `<div class="gp-modal gp-modal--operation" role="dialog" aria-modal="true" aria-labelledby="gp-operation-title">
      <div class="gp-mtitle" id="gp-operation-title">${draft.area}구역 완료 · 작전 회의</div>
      <div class="gp-msub">하나를 골라 이번 감사 런의 <b>다음 피버</b>를 바꾸세요.<br>가장 많이 쌓은 계열이 피버의 성격이 됩니다.</div>
      <div class="gp-oplist">${cards}</div>
      <div class="gp-opnote">다음 작전 회의는 3구역 뒤 · 동률이면 방금 고른 계열 우선</div>
      <button type="button" class="gp-btn gp-btn--gold gp-btn--disabled gp-opconfirm" data-operation-confirm disabled>작전을 먼저 고르세요</button>
    </div>`;
    // 보스 성공 직전의 연속 탭이 새로 열린 카드에 전달되어 작전을 오선택하지 않게 짧게 입력을 안정화한다.
    const operationReadyTimer = setTimeout(() => { ov.dataset.ready = "true"; }, 450);
    ov.addEventListener("click", (event) => {
      const card = event.target.closest("[data-operation]");
      if (card) {
        if (ov.dataset.ready !== "true") return;
        ov.querySelectorAll("[data-operation]").forEach((item) => {
          const selected = item === card;
          item.classList.toggle("gp-opcard--selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        const operation = choices.find((item) => item.id === card.dataset.operation);
        const confirm = ov.querySelector("[data-operation-confirm]");
        confirm.disabled = false;
        confirm.classList.remove("gp-btn--disabled");
        confirm.dataset.selectedOperation = card.dataset.operation;
        confirm.textContent = `${operation?.name || "선택한 작전"} 채택`;
        return;
      }
      const confirm = event.target.closest("[data-operation-confirm]");
      const selectedId = confirm?.dataset.selectedOperation;
      if (!selectedId || !this.gameState.chooseOperation(selectedId)) return;
      clearTimeout(operationReadyTimer);
      document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "powerup" }));
      ov.remove();
      this._operationModal = null;
      this._drainBanners();
    });
    this._operationModal = ov;
    this._clearActiveBanner();
    this.root.appendChild(ov);
    requestAnimationFrame(() => ov.querySelector("[data-operation]")?.focus({ preventScroll: true }));
  }

  _showOperationStatus() {
    if (this.root.querySelector(".gp-modal-ov")) return;
    const gs = this.gameState;
    const counts = gs.operationFamilyCounts ? gs.operationFamilyCounts() : {};
    const dominant = gs.dominantOperationFamily ? gs.dominantOperationFamily() : "tap";
    const profile = FEVER_FAMILY_PROFILES[dominant] || FEVER_FAMILY_PROFILES.tap;
    const familyRows = Object.entries(OPERATION_FAMILIES).map(([family, meta]) => {
      const active = family === dominant;
      const fever = FEVER_FAMILY_PROFILES[family];
      return `<div class="gp-opstatus__family gp-opstatus__family--${family}${active ? " gp-opstatus__family--active" : ""}">
        <b>${meta.icon} ${meta.label} ${counts[family] || 0}</b><span>${fever.summary}</span>
      </div>`;
    }).join("");
    const picked = operationDefinitions
      .filter((operation) => gs.operationLevel(operation.id) > 0)
      .map((operation) => `<div class="gp-opstatus__pick"><span>${operation.icon} ${operation.name}</span><b>Lv.${gs.operationLevel(operation.id)}</b></div>`)
      .join("") || `<div class="gp-opstatus__empty">3구역을 완료하면 첫 작전 회의가 열립니다.</div>`;

    this._openModal(`
      <div class="gp-modal__badge">${profile.icon}</div>
      <div class="gp-mtitle">이번 감사 런 작전</div>
      <div class="gp-msub">현재 우세는 <b>${profile.name}</b><br>${profile.description}</div>
      <div class="gp-opstatus__families">${familyRows}</div>
      <div class="gp-opstatus__picks">${picked}</div>
      <div class="gp-opnote">열기 100% → 12초 피버 → 마지막 4초 막판 총력 → 30초 재정비</div>
      <button class="gp-btn gp-btn--gold" data-close>현장으로</button>`);
  }

  _maybeFeverReport() {
    if (this._feverReportEl?.isConnected || this._bossEl?.isConnected || this.root.querySelector(".gp-modal-ov")) return;
    const report = this.gameState.data.fever?.report;
    if (!report) return;
    this._clearActiveBanner({ requeue: true });
    this._setCentralVisualActive(true);
    const profile = FEVER_FAMILY_PROFILES[report.family] || FEVER_FAMILY_PROFILES.tap;
    const recap = document.createElement("section");
    recap.className = `gp-fever-recap gp-fever-recap--${report.family}`;
    recap.setAttribute("role", "status");
    recap.setAttribute("aria-live", "polite");
    recap.innerHTML = `
      <button type="button" class="gp-fever-recap__close" aria-label="피버 결산 닫기">×</button>
      <div class="gp-fever-recap__title">${report.finisherUsed ? "⚡" : profile.icon} ${profile.name} 결산</div>
      <div class="gp-fever-report">
        <div><span>처리한 표</span><b>+${shortNumber(report.votes)}</b></div>
        <div><span>피버 행동</span><b>${report.actions}회</b></div>
        <div><span>최고 콤보</span><b>${report.bestCombo}</b></div>
      </div>
      <div class="gp-fever-recap__note">${report.finisherUsed ? "막판 총력 성공" : "다음엔 마지막 4초를 노리세요"} · 30초 재정비</div>`;
    const dismiss = () => {
      if (!recap.isConnected) return;
      clearTimeout(this._feverReportTimer);
      recap.classList.remove("gp-fever-recap--in");
      setTimeout(() => {
        recap.remove();
        this._drainBanners();
        if (!this._bannerActive) this._setCentralVisualActive(false);
      }, 180);
      this.gameState.dismissFeverReport?.();
    };
    recap.querySelector(".gp-fever-recap__close").addEventListener("click", dismiss);
    this._feverReportEl = recap;
    this.root.appendChild(recap);
    requestAnimationFrame(() => recap.classList.add("gp-fever-recap--in"));
    this._feverReportTimer = setTimeout(dismiss, 6000);
  }

  _confirmPrestige() {
    const proj = this.gameState.prestigeProjection
      ? this.gameState.prestigeProjection()
      : { earned: 0, current: 1, projected: 1, medalEarned: 0 };
    const medalLine = proj.medalEarned > 0 ? ` · <b style="color:#ffd479">🏆 훈장 +${proj.medalEarned}</b>` : "";
    const advice = proj.advice || { key: "ready", label: "감사 적기", detail: "다음 런의 영구 생산이 상승합니다" };
    this._openModal(`
      <div class="gp-modal__badge">🔨</div>
      <div class="gp-mtitle">감사 실행</div>
      <div class="gp-msub">표·시설·직원은 초기화되지만, <b>제도인장 +${proj.earned}</b>${medalLine}을 받아 <b>영구 생산 배율</b>이 영원히 오릅니다. (감사 업그레이드·업적은 유지)</div>
      <div class="gp-mbig">영구 x${proj.current.toFixed(2)} → <span style="color:#8df0b0">x${proj.projected.toFixed(2)}</span></div>
      <div class="gp-prestige-advice gp-prestige-advice--${advice.key}">
        <span><b>현재보다 +${proj.gainPct.toFixed(1)}%</b><small>${advice.detail}</small></span>
        <em>${advice.label}</em>
      </div>
      <div class="gp-confirm-row">
        <button class="gp-btn gp-btn--disabled" data-close>취소</button>
        <button class="gp-btn gp-btn--gold" data-confirm>감사 실행</button>
      </div>`, () => this.gameState.prestigeReset());
  }

  // 구역·위기·보상을 하나의 우선순위 큐로 직렬화한다.
  // 같은 changed 틱의 알림을 microtask 동안 모은 뒤 정렬해 중앙 메시지가 겹치지 않게 한다.
  _banner(text, { priority = 1, tone = "reward" } = {}) {
    const cleanText = String(text || "").trim();
    if (!cleanText || this._destroyed) return;
    if (!this._bannerQueue) this._bannerQueue = [];
    if (this._bannerCurrent?.text === cleanText || this._bannerQueue.some((item) => item.text === cleanText)) return;

    this._bannerSequence = (this._bannerSequence || 0) + 1;
    this._bannerQueue.push({ text: cleanText, priority, tone, sequence: this._bannerSequence });
    this._bannerQueue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
    if (this._bannerQueue.length > 8) this._bannerQueue.length = 8;

    if (this._bannerDrainScheduled) return;
    this._bannerDrainScheduled = true;
    queueMicrotask(() => {
      this._bannerDrainScheduled = false;
      this._drainBanners();
    });
  }

  _drainBanners() {
    if (this._destroyed || this._bannerActive || !this._bannerQueue?.length) return;
    if (this.root.querySelector(".gp-modal-ov") || this._bossEl?.isConnected || this._feverReportEl?.isConnected) return;
    this._bannerActive = true;
    const item = this._bannerQueue.shift();
    this._bannerCurrent = item;
    const b = document.createElement("div");
    b.className = `gp-banner gp-banner--${item.tone}`;
    b.setAttribute("role", "status");
    b.setAttribute("aria-live", item.tone === "danger" ? "assertive" : "polite");
    b.setAttribute("aria-atomic", "true");
    b.textContent = item.text;
    this._bannerEl = b;
    this.root.appendChild(b);
    this._setCentralVisualActive(true);
    requestAnimationFrame(() => b.classList.add("gp-banner--in"));
    const hold = this._bannerQueue.length ? 1050 : item.tone === "stage" ? 1900 : 1700;
    this._bannerHoldTimer = setTimeout(() => {
      b.classList.remove("gp-banner--in");
      this._bannerExitTimer = setTimeout(() => {
        b.remove();
        this._bannerEl = null;
        this._bannerActive = false;
        this._bannerCurrent = null;
        this._drainBanners();
        if (!this._bannerActive && !this._feverReportEl?.isConnected) this._setCentralVisualActive(false);
      }, 260);
    }, hold);
  }

  _clearActiveBanner({ requeue = false } = {}) {
    if (requeue && this._bannerCurrent && !this._bannerQueue?.some((item) => item.text === this._bannerCurrent.text)) {
      if (!this._bannerQueue) this._bannerQueue = [];
      this._bannerSequence = (this._bannerSequence || 0) + 1;
      this._bannerQueue.push({ ...this._bannerCurrent, sequence: this._bannerSequence });
      this._bannerQueue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
      if (this._bannerQueue.length > 8) this._bannerQueue.length = 8;
    }
    clearTimeout(this._bannerHoldTimer);
    clearTimeout(this._bannerExitTimer);
    this._bannerEl?.remove();
    this._bannerEl = null;
    this._bannerActive = false;
    this._bannerCurrent = null;
    this._setCentralVisualActive(false);
  }

  _setCentralVisualActive(active) {
    if (this._centralVisualActive === active) return;
    this._centralVisualActive = active;
    document.dispatchEvent(new CustomEvent("gp:central-visual", { detail: { active } }));
  }

  _showOfflineReward(onClose) {
    // 기본 보상은 로드 시 이미 적용됨. 모달은 그 양을 보여주고, 하루 1회 '2배 받기'로 같은 양을 한 번 더 받는 선택 제공.
    const r = this.gameState.offlineReward;
    if (!r) return;
    const totalMin = Math.max(1, Math.floor(r.elapsed / 60000));
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    const timeStr = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
    const capMs = this.gameState.offlineCapMsFor ? this.gameState.offlineCapMsFor(this.gameState.data) : 28800000;
    const capH = Math.round(capMs / 3600000);
    const near = r.elapsed >= capMs * 0.95;
    const can2x = this.gameState.offline2xAvailable && this.gameState.offline2xAvailable();
    const progressApplied = Math.max(0, Number(r.progressApplied) || 0);
    const carryAdded = Math.max(0, Number(r.carryAdded) || 0);
    const carryTotal = Math.max(0, Number(r.carryTotal) || 0);
    const previousCarry = Math.max(0, carryTotal - carryAdded);
    // FIX P0: 2× button uses gold+ready theme (premium CTA), physically larger than plain claim
    // Plain claim uses gp-btn--disabled style so gold 2× is the obvious choice
    const footer = can2x
      ? `<div class="gp-confirm-row" style="align-items:stretch">
           <button class="gp-btn gp-btn--disabled" data-close style="flex:1">그냥 수령</button>
           <button class="gp-btn gp-btn--gold gp-btn--ready gp-btn--upgrade" data-confirm style="flex:1.4;font-size:15px">2배로 받기<small>이월도 추가 · 하루 1회</small></button>
         </div>`
      : `<button class="gp-btn" data-close>수령하기</button>`;
    this._openModal(`
      <div class="gp-modal__badge">💤</div>
      <div class="gp-mtitle">오프라인 정산</div>
      <div class="gp-msub">${timeStr} 동안 개표가 계속됐어요${near ? `<br><span style="color:#ffcd75">최대 ${capH}시간까지 적립돼요 — 자주 들러요!</span>` : ""}</div>
      <div class="gp-mbig">+${shortNumber(r.votes)}표<br><span>+${shortNumber(r.explain)} 해명</span></div>
      <div class="gp-offline-split" aria-label="오프라인 구역 진행 배분">
        <div><small>현재 구역 반영</small><b>+${shortNumber(progressApplied)}</b></div>
        <div class="gp-offline-split__carry"><small>다음 지역 이월</small><b>+${shortNumber(carryAdded)}</b></div>
      </div>
      ${carryTotal > 0 ? `<div class="gp-offline-note">미처리 개표함 ${shortNumber(carryTotal)}표${previousCarry > 0 ? ` · 기존 ${shortNumber(previousCarry)} 포함` : ""}<br>지역 완료 때 자동 반영되며 보스·작전 앞에서 멈춥니다.</div>` : ""}
      ${footer}`, () => this.gameState.claimOfflineBonus(), onClose);
  }

  _checkMilestone(f) {
    if (!f) return;
    const lv = this.gameState.level(f.id);
    if (MILESTONES.includes(lv)) {
      this._banner(`🎉 ${f.name} Lv.${lv} 마일스톤!`, { priority: 1, tone: "reward" });
      this._flash();
    }
  }

  // 단계형 온보딩 코치: 탭 → 업그레이드 → 채용 → 사건. stats 기반이라 진행과 항상 일치.
  _maybeHint() {
    const gs = this.gameState;
    const d = gs.data;
    if (gs.bossActive?.()) { this._clearHint(); return; }
    if (d.tutorial && d.tutorial.done) { this._clearHint(); return; }

    const clicks = d.stats.totalClicks || 0;
    const upgrades = d.stats.totalUpgrades || 0;
    const staffHired = Object.values(d.staff || {}).some((lv) => lv > 0);
    const events = d.stats.totalEvents || 0;

    let step; // { txt, hand, arrow }
    if (clicks < 5) step = { txt: "화면을 탭해 표를 처리하세요!", hand: true };
    else if (upgrades === 0) step = { txt: "↓ 시설 탭에서 접수창구를 업그레이드하세요", arrow: true };
    else if (!staffHired) step = { txt: "↓ 직원 탭에서 직원을 채용하세요", arrow: true };
    else if (events === 0) step = { txt: "↓ 사건 탭에서 첫 사건에 대응하세요", arrow: true };
    else { this._clearHint(); return; }

    if (!this._hint) {
      this._hint = document.createElement("div");
      this.root.appendChild(this._hint);
    }
    this._hint.className = step.arrow ? "gp-hint gp-hint--bottom" : "gp-hint";
    this._hint.innerHTML = `${step.hand ? '<div class="gp-hint__hand"></div>' : ""}<div class="gp-hint__txt">${step.txt}</div>`;
  }

  _clearHint() {
    if (this._hint) { this._hint.remove(); this._hint = null; }
  }

  // 첫 감사(프레스티지) 이후 한 번만 정중히 알림 권한 요청. 거부/미지원/이미물음 → 무동작.
  _maybeNotifPrompt() {
    const n = this.notifications;
    if (!n || this._notifPromptShown) return;
    if (this._bossEl?.isConnected || this.root.querySelector(".gp-modal-ov")) return;
    if (!n.supported() || n.asked() || n.permission() !== "default") return;
    if ((this.gameState.data.prestige?.runs || 0) < 1) return;
    this._notifPromptShown = true;
    this._openModal(`
      <div class="gp-modal__badge">🔔</div>
      <div class="gp-mtitle">알림을 켤까요?</div>
      <div class="gp-msub">출석 보상·오프라인 정산이 준비되면 알려드려요. 언제든 끌 수 있어요.</div>
      <div class="gp-confirm-row">
        <button class="gp-btn gp-btn--disabled" data-close>나중에</button>
        <button class="gp-btn gp-btn--gold" data-confirm>알림 켜기</button>
      </div>`, () => { n.requestPermission().catch(() => {}); });
  }

  _openModal(html, onConfirm, onClose) {
    this._clearActiveBanner({ requeue: true });
    const ov = document.createElement("div");
    ov.className = "gp-modal-ov";
    ov.innerHTML = `<div class="gp-modal">${html}</div>`;
    ov.addEventListener("click", (e) => {
      if (e.target.closest("[data-confirm]")) {
        if (onConfirm) onConfirm();
        ov.remove();
        if (onClose) onClose();
        this._drainBanners();
      } else if (e.target.closest("[data-close]") || e.target === ov) {
        ov.remove();
        if (onClose) onClose();
        this._drainBanners();
      }
    });
    this.root.appendChild(ov);
  }

  _flash() {
    const fl = document.createElement("div");
    fl.className = "gp-flash";
    this.root.appendChild(fl);
    setTimeout(() => fl.remove(), 420);
  }

  // 인사 발령 뽑기 결과 리빌 — 칭호 등급색 카드 + 신규/승진 표시 + 능력
  _showGachaResult(res) {
    if (!res) return;
    const color = RARITY_COLOR[res.rarity] || "#ffd479";
    const tag = res.isNew ? "🎉 신규 발령" : `⬆️ 승진 · Lv.${res.level}`;
    if (res.rarity === "rare") this._flash(); // 희귀는 화면 플래시로 강조
    this._openModal(`
      <div class="gp-gres" style="--rc:${color}">
        <div class="gp-gres__tag">${tag}</div>
        <div class="gp-gres__emoji">${res.emoji}</div>
        <div class="gp-gres__name" style="color:${color}">${res.name}</div>
        <div class="gp-gres__rarity" style="color:${color}">${RARITY_LABEL[res.rarity] || ""}</div>
        <div class="gp-gres__per">${res.per}</div>
      </div>
      <button class="gp-btn gp-btn--gold" data-close>확인</button>`);
  }

  // 체제 전복(공산화) 하드 리셋 연출 — 풍자 모달. 메타 유지 안내로 좌절 완화.
  _showCollapse(p) {
    this._flash();
    document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "crisis" }));
    this._openModal(`
      <div class="gp-modal__badge">🚩</div>
      <div class="gp-mtitle" style="color:#ff6b6b">체제 전복!</div>
      <div class="gp-msub">믿음이 바닥나 개표국이 <b>인민개표위원회</b>로 넘어갔습니다.<br>표·시설·직원·구역은 초기화됐지만, <b>감사 업그레이드·도감·국장 칭호·업적은 그대로</b>입니다. 다시 신뢰를 쌓아 재건하세요.</div>
      <div class="gp-mbig" style="font-size:15px">누적 전복 ${p?.collapses || 1}회</div>
      <button class="gp-btn gp-btn--gold" data-close>개표국 재건</button>`);
  }

  destroy() {
    this._destroyed = true;
    this._setCentralVisualActive(false);
    this.gameState.off("upgraded", this._onUpgraded);
    this.gameState.off("changed", this._onChanged);
    this.gameState.off("celebrate", this._onCelebrate);
    this.gameState.off("comm-warning", this._onCommWarning);
    this.gameState.off("comm-collapse", this._onCommCollapse);
    this.gameState.off("boss-start", this._onBossStart);
    this.gameState.off("boss-end", this._onBossEnd);
    document.removeEventListener("gp:prestige-confirm", this._onPrestigeConfirm);
    document.removeEventListener("gp:gacha-result", this._onGachaResult);
    document.removeEventListener("gp:gacha-result10", this._onGachaResult10);
    document.removeEventListener("gp:open-operations", this._onOpenOperations);
    this._operationModal?.remove();
    clearTimeout(this._feverReportTimer);
    clearTimeout(this._bannerHoldTimer);
    clearTimeout(this._bannerExitTimer);
    clearTimeout(this._bossAdvanceTimer);
    clearInterval(this._bossClockTimer);
    this._feverReportEl?.remove();
    this._bossEl?.remove();
    this.root.remove();
  }
}
