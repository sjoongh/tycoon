import { shortNumber } from "../utils/format.js";
import { GOV_MAPS, PROP_MAPS, dotSvgUri } from "../world/dotChar.js";
import { RARITY_LABEL, RARITY_COLOR } from "../data/titles.js";
import { FEVER_FAMILY_PROFILES, OPERATION_FAMILIES, operationDefinitions } from "../data/operations.js";

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
    this._onChanged = () => { this._maybeHint(); this._checkStage(); this._maybeOperationDraft(); this._maybeFeverReport(); this._maybeNotifPrompt(); };
    this._onPrestigeConfirm = () => this._confirmPrestige();
    this._onCelebrate = (p) => { this._toast(p.text); this._flash(); };
    this._onGachaResult = (e) => this._showGachaResult(e.detail);
    this._onGachaResult10 = (e) => this._showGachaResult10(e.detail);
    this._onCommWarning = (p) => { this._banner(p.text); document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "crisis" })); };
    this._onCommCollapse = (p) => this._showCollapse(p);
    this._onOpenOperations = () => this._showOperationStatus();
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.gameState.on("upgraded", this._onUpgraded);
    this.gameState.on("changed", this._onChanged);
    this.gameState.on("celebrate", this._onCelebrate);
    this.gameState.on("comm-warning", this._onCommWarning);
    this.gameState.on("comm-collapse", this._onCommCollapse);
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
      if (e.target.closest("[data-skip]")) { ov.remove(); return; }
      if (!e.target.closest("[data-next]")) return;
      i += 1;
      if (i >= cards.length) ov.remove();
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
      this._banner(`${a}구역 진입!`);
      this._flash();
    } else if (a < this._prevArea) {
      this._prevArea = a; // prestige reset
    }
  }

  // 3구역을 완료할 때마다 현장/운영/대응 3축 중 하나를 고르는 런 작전 드래프트.
  // 다른 보상 모달이 열려 있으면 다음 changed 틱까지 기다려 모달 중첩을 피한다.
  _maybeOperationDraft() {
    if (this._operationModal?.isConnected || this.root.querySelector(".gp-modal-ov")) return;
    const draft = this.gameState.data.operations?.draft;
    const choices = this.gameState.operationDraftDefinitions ? this.gameState.operationDraftDefinitions() : [];
    if (!draft || choices.length !== 3) return;

    const cards = choices.map((operation) => {
      const level = this.gameState.operationLevel(operation.id);
      const family = OPERATION_FAMILIES[operation.family];
      const profile = FEVER_FAMILY_PROFILES[operation.family];
      const recommendation = this.gameState.operationRecommendationText?.(operation.family) || "";
      return `<button type="button" class="gp-opcard gp-opcard--${operation.family}" data-operation="${operation.id}" aria-label="${operation.name} 레벨 ${level + 1} 선택">
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
    </div>`;
    ov.addEventListener("click", (event) => {
      const card = event.target.closest("[data-operation]");
      if (!card) return;
      if (!this.gameState.chooseOperation(card.dataset.operation)) return;
      document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "powerup" }));
      ov.remove();
      this._operationModal = null;
    });
    this._operationModal = ov;
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
    if (this._feverReportEl?.isConnected || this.root.querySelector(".gp-modal-ov")) return;
    const report = this.gameState.data.fever?.report;
    if (!report) return;
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
      setTimeout(() => recap.remove(), 180);
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
    this._openModal(`
      <div class="gp-modal__badge">🔨</div>
      <div class="gp-mtitle">감사 실행</div>
      <div class="gp-msub">표·시설·직원은 초기화되지만, <b>제도인장 +${proj.earned}</b>${medalLine}을 받아 <b>영구 생산 배율</b>이 영원히 오릅니다. (감사 업그레이드·업적은 유지)</div>
      <div class="gp-mbig">영구 x${proj.current.toFixed(2)} → <span style="color:#8df0b0">x${proj.projected.toFixed(2)}</span></div>
      <div class="gp-confirm-row">
        <button class="gp-btn gp-btn--disabled" data-close>취소</button>
        <button class="gp-btn gp-btn--gold" data-confirm>감사 실행</button>
      </div>`, () => this.gameState.prestigeReset());
  }

  // 배너는 큐로 1개씩 순차 표시 — 동시에 여러 성취(업적·다중 목표 완료)가 떠도 겹쳐 가려지지 않게.
  _banner(text) {
    if (!this._bannerQueue) this._bannerQueue = [];
    this._bannerQueue.push(text);
    if (this._bannerQueue.length > 6) this._bannerQueue.length = 6; // 폭주 시 상한(오프라인 다중완료 등)
    this._drainBanners();
  }

  _drainBanners() {
    if (this._bannerActive || !this._bannerQueue || !this._bannerQueue.length) return;
    this._bannerActive = true;
    const text = this._bannerQueue.shift();
    const b = document.createElement("div");
    b.className = "gp-banner";
    b.textContent = text;
    this.root.appendChild(b);
    requestAnimationFrame(() => b.classList.add("gp-banner--in"));
    const hold = this._bannerQueue.length ? 1100 : 2000; // 대기 중이면 짧게 흘려 빠르게 소진
    setTimeout(() => {
      b.classList.remove("gp-banner--in");
      setTimeout(() => { b.remove(); this._bannerActive = false; this._drainBanners(); }, 400);
    }, hold);
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
    // FIX P0: 2× button uses gold+ready theme (premium CTA), physically larger than plain claim
    // Plain claim uses gp-btn--disabled style so gold 2× is the obvious choice
    const footer = can2x
      ? `<div class="gp-confirm-row" style="align-items:stretch">
           <button class="gp-btn gp-btn--disabled" data-close style="flex:1">그냥 수령</button>
           <button class="gp-btn gp-btn--gold gp-btn--ready gp-btn--upgrade" data-confirm style="flex:1.4;font-size:15px">2배로 받기<small>하루 1회</small></button>
         </div>`
      : `<button class="gp-btn" data-close>수령하기</button>`;
    this._openModal(`
      <div class="gp-modal__badge">💤</div>
      <div class="gp-mtitle">오프라인 정산</div>
      <div class="gp-msub">${timeStr} 동안 개표가 계속됐어요${near ? `<br><span style="color:#ffcd75">최대 ${capH}시간까지 적립돼요 — 자주 들러요!</span>` : ""}</div>
      <div class="gp-mbig">+${shortNumber(r.votes)}표<br><span>+${shortNumber(r.explain)} 해명</span></div>
      ${footer}`, () => this.gameState.claimOfflineBonus(), onClose);
  }

  _checkMilestone(f) {
    if (!f) return;
    const lv = this.gameState.level(f.id);
    if (MILESTONES.includes(lv)) {
      this._toast(`🎉 ${f.name} Lv.${lv} 마일스톤!`);
      this._flash();
    }
  }

  // 단계형 온보딩 코치: 탭 → 업그레이드 → 채용 → 사건. stats 기반이라 진행과 항상 일치.
  _maybeHint() {
    const gs = this.gameState;
    const d = gs.data;
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
    if (this.root.querySelector(".gp-modal-ov")) return;
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
    const ov = document.createElement("div");
    ov.className = "gp-modal-ov";
    ov.innerHTML = `<div class="gp-modal">${html}</div>`;
    ov.addEventListener("click", (e) => {
      if (e.target.closest("[data-confirm]")) {
        if (onConfirm) onConfirm();
        ov.remove();
        if (onClose) onClose();
      } else if (e.target.closest("[data-close]") || e.target === ov) {
        ov.remove();
        if (onClose) onClose();
      }
    });
    this.root.appendChild(ov);
  }

  // 토스트는 큐로 1개씩 순차 표시 — 대량 동시 완료(오프라인 복귀·첫 감사 등)에도
  // 중앙 캐릭터/숫자를 토스트 더미가 덮지 않게(깔끔한 중앙 focus 유지).
  _toast(text) {
    if (!this._toastQueue) this._toastQueue = [];
    this._toastQueue.push(text);
    if (this._toastQueue.length > 8) this._toastQueue.length = 8; // 폭주 상한
    this._drainToasts();
  }

  _drainToasts() {
    if (this._toastActive || !this._toastQueue || !this._toastQueue.length) return;
    this._toastActive = true;
    const text = this._toastQueue.shift();
    const t = document.createElement("div");
    t.className = "gp-toast";
    t.textContent = text;
    this.root.appendChild(t);
    requestAnimationFrame(() => t.classList.add("gp-toast--in"));
    const hold = this._toastQueue.length ? 900 : 2200; // 대기 중이면 짧게 흘려 빠르게 소진
    setTimeout(() => {
      t.classList.remove("gp-toast--in");
      setTimeout(() => { t.remove(); this._toastActive = false; this._drainToasts(); }, 300);
    }, hold);
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
    this.gameState.off("upgraded", this._onUpgraded);
    this.gameState.off("changed", this._onChanged);
    this.gameState.off("celebrate", this._onCelebrate);
    this.gameState.off("comm-warning", this._onCommWarning);
    this.gameState.off("comm-collapse", this._onCommCollapse);
    document.removeEventListener("gp:prestige-confirm", this._onPrestigeConfirm);
    document.removeEventListener("gp:gacha-result", this._onGachaResult);
    document.removeEventListener("gp:gacha-result10", this._onGachaResult10);
    document.removeEventListener("gp:open-operations", this._onOpenOperations);
    this._operationModal?.remove();
    clearTimeout(this._feverReportTimer);
    this._feverReportEl?.remove();
    this.root.remove();
  }
}
