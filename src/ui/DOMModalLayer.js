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
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.gameState.on("upgraded", this._onUpgraded);
    this.gameState.on("changed", this._onChanged);
    document.addEventListener("gp:prestige-confirm", this._onPrestigeConfirm);
    if (!this._maybeOpening()) this._showOfflineReward();
    this._maybeHint();
  }

  // 신규 첫 세션 오프닝(3카드). 보여줬으면 true 반환(오프라인 보상은 다음 세션부터).
  _maybeOpening() {
    const d = this.gameState.data;
    const fresh = !d.tutorial?.done && (d.stats.totalClicks || 0) === 0 && d.stage.area === 1 && d.stage.progress === 0;
    if (!fresh) return false;
    const cards = [
      { art: "/art/worker-clerk.png", t: "믿어주세요, 개표국", s: "오늘부터 당신이 개표국장입니다. 믿음도 바닥, 서류도 엉망. 밑바닥에서 시작합니다." },
      { art: "/art/desk-t1.png", t: "표를 처리하라", s: "화면을 탭해 표를 처리하고, 시설을 키우고, 직원을 채용하세요." },
      { art: "/art/ballotbox.png", t: "사건에 대응하라", s: "터지는 사건마다 믿음이 걸려 있습니다. 전국이 지켜봅니다. 자, 분류 시작!" },
    ];
    let i = 0;
    const ov = document.createElement("div");
    ov.className = "gp-modal-ov";
    const render = () => {
      const c = cards[i];
      ov.innerHTML = `<div class="gp-modal"><div class="gp-modal__art" style="background-image:url('${c.art}')"></div><div class="gp-mtitle">${c.t}</div><div class="gp-msub">${c.s}</div><button class="gp-btn gp-btn--gold" data-next>${i < cards.length - 1 ? "다음" : "분류 시작!"}</button></div>`;
    };
    ov.addEventListener("click", (e) => {
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
    this._openModal(`
      <div class="gp-modal__badge">🔨</div>
      <div class="gp-mtitle">감사 실행</div>
      <div class="gp-msub">모든 진행도가 초기화되고 제도인장을 얻습니다. 계속할까요?</div>
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
    const r = this.gameState.consumeOfflineReward ? this.gameState.consumeOfflineReward() : null;
    if (!r) return;
    const mins = Math.max(1, Math.floor(r.elapsed / 60000));
    this._openModal(`
      <div class="gp-modal__badge">💤</div>
      <div class="gp-mtitle">오프라인 정산</div>
      <div class="gp-msub">${mins}분 동안 개표가 계속됐어요</div>
      <div class="gp-mbig">+${shortNumber(r.votes)}표<br><span>+${shortNumber(r.explain)} 해명</span></div>
      <button class="gp-btn" data-close>수령하기</button>`);
  }

  _checkMilestone(f) {
    if (!f) return;
    const lv = this.gameState.level(f.id);
    if (MILESTONES.includes(lv)) {
      this._toast(`🎉 ${f.name} Lv.${lv} 마일스톤!`);
      this._flash();
    }
  }

  _maybeHint() {
    const done = this.gameState.data.tutorial && this.gameState.data.tutorial.done;
    const tapped = (this.gameState.data.stats.totalClicks || 0) >= 3;
    const shouldShow = !done && !tapped;
    if (shouldShow && !this._hint) {
      this._hint = document.createElement("div");
      this._hint.className = "gp-hint";
      this._hint.innerHTML = `<div class="gp-hint__hand"></div><div class="gp-hint__txt">화면을 탭해 표를 처리하세요!</div>`;
      this.root.appendChild(this._hint);
    } else if (!shouldShow && this._hint) {
      this._hint.remove();
      this._hint = null;
    }
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
    const t = document.createElement("div");
    t.className = "gp-toast";
    t.textContent = text;
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
    document.removeEventListener("gp:prestige-confirm", this._onPrestigeConfirm);
    this.root.remove();
  }
}
