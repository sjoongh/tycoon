import { shortNumber } from "../utils/format.js";
import { GOV_MAPS, PROP_MAPS, dotSvgUri } from "../world/dotChar.js";
import { RARITY_LABEL, RARITY_COLOR } from "../data/titles.js";

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
    this._onChanged = () => { this._maybeHint(); this._checkStage(); this._maybeNotifPrompt(); };
    this._onPrestigeConfirm = () => this._confirmPrestige();
    this._onCelebrate = (p) => { this._toast(p.text); this._flash(); };
    this._onGachaResult = (e) => this._showGachaResult(e.detail);
    this._onCommWarning = (p) => { this._banner(p.text); document.dispatchEvent(new CustomEvent("gp:sfx", { detail: "crisis" })); };
    this._onCommCollapse = (p) => this._showCollapse(p);
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
    if (!this._maybeOpening()) {
      // 오프라인 정산을 먼저 보여주고, 닫은 뒤에 출석 보상(겹쳐 가려지지 않게 체인)
      if (this.gameState.offlineReward) this._showOfflineReward(() => this._maybeDaily());
      else this._maybeDaily();
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
    // openingSeen 영구 플래그로 한 번만 노출(첫 탭 전 새로고침 시 매번 재표시되던 버그 수정)
    const fresh = !d.tutorial?.done && !d.tutorial?.openingSeen && (d.stats.totalClicks || 0) === 0 && d.stage.area === 1 && d.stage.progress === 0;
    if (!fresh) return false;
    if (d.tutorial) d.tutorial.openingSeen = true;
    this.gameState.save && this.gameState.save(false);
    const cards = [
      { art: dotSvgUri(GOV_MAPS[0]), t: "믿어주세요, 개표국", s: "오늘부터 당신이 개표국장입니다. 믿음도 바닥, 서류도 엉망. 밑바닥에서 시작합니다." },
      { art: dotSvgUri(PROP_MAPS["prop-sorter"]), t: "표를 처리하라", s: "화면을 탭해 표를 처리하고, 시설을 키우고, 직원을 채용하세요." },
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
    this.root.remove();
  }
}
