import { shortNumber } from "../utils/format.js";

const MILESTONES = [5, 10, 25, 45];

// 오프라인 보상 모달 + 마일스톤 연출 + 신규 온보딩 힌트
export class DOMModalLayer {
  constructor(gameState) {
    this.gameState = gameState;
    this.root = document.createElement("div");
    this.root.className = "gp-modal-layer";
    this._hint = null;
    this._prevArea = gameState.data.stage.area;
    this._onUpgraded = (f) => this._checkMilestone(f);
    this._onChanged = () => { this._maybeHint(); this._checkStage(); };
    this._onPrestigeConfirm = () => this._confirmPrestige();
    this._onCelebrate = (p) => { this._toast(p.text); this._flash(); };
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.gameState.on("upgraded", this._onUpgraded);
    this.gameState.on("changed", this._onChanged);
    this.gameState.on("celebrate", this._onCelebrate);
    document.addEventListener("gp:prestige-confirm", this._onPrestigeConfirm);
    if (!this._maybeOpening()) {
      this._showOfflineReward();
      this._maybeDaily();
    }
    this._maybeHint();
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
    const fresh = !d.tutorial?.done && (d.stats.totalClicks || 0) === 0 && d.stage.area === 1 && d.stage.progress === 0;
    if (!fresh) return false;
    const cards = [
      { art: "/art/worker-clerk.webp", t: "믿어주세요, 개표국", s: "오늘부터 당신이 개표국장입니다. 믿음도 바닥, 서류도 엉망. 밑바닥에서 시작합니다." },
      { art: "/art/desk-t1.webp", t: "표를 처리하라", s: "화면을 탭해 표를 처리하고, 시설을 키우고, 직원을 채용하세요." },
      { art: "/art/ballotbox.webp", t: "사건에 대응하라", s: "터지는 사건마다 믿음이 걸려 있습니다. 전국이 지켜봅니다. 자, 분류 시작!" },
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

  _confirmPrestige() {
    const proj = this.gameState.prestigeProjection
      ? this.gameState.prestigeProjection()
      : { earned: 0, current: 1, projected: 1 };
    this._openModal(`
      <div class="gp-modal__badge">🔨</div>
      <div class="gp-mtitle">감사 실행</div>
      <div class="gp-msub">표·시설·직원은 초기화되지만, <b>제도인장 +${proj.earned}</b>을 받아 <b>영구 생산 배율</b>이 영원히 오릅니다. (감사 업그레이드·업적은 유지)</div>
      <div class="gp-mbig">영구 x${proj.current.toFixed(2)} → <span style="color:#8df0b0">x${proj.projected.toFixed(2)}</span></div>
      <div class="gp-confirm-row">
        <button class="gp-btn gp-btn--disabled" data-close>취소</button>
        <button class="gp-btn gp-btn--gold" data-confirm>감사 실행</button>
      </div>`, () => this.gameState.prestigeReset());
  }

  _banner(text) {
    const b = document.createElement("div");
    b.className = "gp-banner";
    b.textContent = text;
    this.root.appendChild(b);
    requestAnimationFrame(() => b.classList.add("gp-banner--in"));
    setTimeout(() => { b.classList.remove("gp-banner--in"); setTimeout(() => b.remove(), 400); }, 2200);
  }

  _showOfflineReward() {
    // 기본 보상은 로드 시 이미 적용됨. 모달은 그 양을 보여주고, 하루 1회 '2배 받기'로 같은 양을 한 번 더 받는 선택 제공.
    const r = this.gameState.offlineReward;
    if (!r) return;
    const mins = Math.max(1, Math.floor(r.elapsed / 60000));
    const can2x = this.gameState.offline2xAvailable && this.gameState.offline2xAvailable();
    const footer = can2x
      ? `<div class="gp-confirm-row">
           <button class="gp-btn gp-btn--disabled" data-close>그냥 수령</button>
           <button class="gp-btn gp-btn--gold" data-confirm>🎁 2배로 받기</button>
         </div>`
      : `<button class="gp-btn" data-close>수령하기</button>`;
    this._openModal(`
      <div class="gp-modal__badge">💤</div>
      <div class="gp-mtitle">오프라인 정산</div>
      <div class="gp-msub">${mins}분 동안 개표가 계속됐어요</div>
      <div class="gp-mbig">+${shortNumber(r.votes)}표<br><span>+${shortNumber(r.explain)} 해명</span></div>
      ${footer}`, () => this.gameState.claimOfflineBonus());
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

  _openModal(html, onConfirm) {
    const ov = document.createElement("div");
    ov.className = "gp-modal-ov";
    ov.innerHTML = `<div class="gp-modal">${html}</div>`;
    ov.addEventListener("click", (e) => {
      if (e.target.closest("[data-confirm]")) {
        if (onConfirm) onConfirm();
        ov.remove();
      } else if (e.target.closest("[data-close]") || e.target === ov) {
        ov.remove();
      }
    });
    this.root.appendChild(ov);
  }

  _toast(text) {
    // 대량 동시 완료(오프라인 복귀·첫 감사 등)에 토스트가 화면을 덮지 않도록 최대 4개로 제한
    const existing = this.root.querySelectorAll(".gp-toast");
    if (existing.length >= 4) return;
    const t = document.createElement("div");
    t.className = "gp-toast";
    t.textContent = text;
    // 동시에 여러 완료가 떠도 겹치지 않도록 기존 토스트 수만큼 아래로 띄운다
    const offset = existing.length * 46;
    if (offset) t.style.top = `${120 + offset}px`;
    this.root.appendChild(t);
    requestAnimationFrame(() => t.classList.add("gp-toast--in"));
    setTimeout(() => {
      t.classList.remove("gp-toast--in");
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  _flash() {
    const fl = document.createElement("div");
    fl.className = "gp-flash";
    this.root.appendChild(fl);
    setTimeout(() => fl.remove(), 420);
  }

  destroy() {
    this.gameState.off("upgraded", this._onUpgraded);
    this.gameState.off("changed", this._onChanged);
    this.gameState.off("celebrate", this._onCelebrate);
    document.removeEventListener("gp:prestige-confirm", this._onPrestigeConfirm);
    this.root.remove();
  }
}
