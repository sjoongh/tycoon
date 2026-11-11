// 특별 개표소 화면(중기 #7) — HUD 칩에서 열리는 전체 오버레이. 메인 월드와 별개 통화(특표)로 5일간 키운다.
import { iconHtml } from "./icon.js";
import { shortNumber } from "../utils/format.js";
import { SPECIAL_STATIONS, SPECIAL_TIERS, SPECIAL_THEMES } from "../data/specialOffice.js";

const TIER_LABEL = Object.fromEntries(SPECIAL_TIERS.map((t) => [t.id, t.name]));
const rewardText = (r) => [r.explain ? `해명 +${r.explain}` : null, r.seals ? `인장 +${r.seals}` : null].filter(Boolean).join(" · ");

export class DOMSpecialOffice {
  constructor(gameState) {
    this.gameState = gameState;
  }

  mount(parent) {
    this.parent = parent;
    this.chip = document.createElement("button");
    this.chip.className = "gp-special-chip";
    this.chip.hidden = true;
    this.chip.addEventListener("click", () => this.open());
    parent.appendChild(this.chip);
    this._tick = setInterval(() => this._syncChip(), 1000);
    this._syncChip();
    document.addEventListener("gp:open-special", () => this.open());
  }

  _syncChip() {
    const gs = this.gameState;
    if (!gs.data.tutorial?.done || !gs.specialState) { this.chip.hidden = true; return; }
    const st = gs.specialState();
    if (!st.open) { this.chip.hidden = true; return; }
    const html = `<b>특별 개표소</b><span>D-${st.daysLeft}</span>`;
    if (this.chip.innerHTML !== html) this.chip.innerHTML = html;
    this.chip.classList.toggle("gp-special-chip--new", (st.sp.total || 0) === 0);
    this.chip.hidden = false;
  }

  open() {
    if (this.ov) return;
    const gs = this.gameState;
    const st = gs.specialState();
    if (!st.open) return;
    this.ov = document.createElement("div");
    this.ov.className = "gp-map-ov gp-special-ov";
    this.ov.addEventListener("click", (e) => this._onClick(e));
    this.parent.appendChild(this.ov);
    this._render(true);
    this._loop = setInterval(() => this._render(false), 250);
    try { document.dispatchEvent(new CustomEvent("gp:special-open")); } catch {}
  }

  close() {
    clearInterval(this._loop);
    this.ov?.remove();
    this.ov = null;
    this._syncChip();
  }

  _onClick(e) {
    const gs = this.gameState;
    if (e.target === this.ov || e.target.closest("[data-k=x]")) { this.close(); return; }
    const tap = e.target.closest("[data-k=tap]");
    if (tap) {
      const v = gs.specialTap();
      if (v > 0) {
        tap.classList.remove("gp-special__tap--hit"); void tap.offsetWidth; tap.classList.add("gp-special__tap--hit");
        const f = document.createElement("span");
        f.className = "gp-special__float";
        f.textContent = `+${shortNumber(v)}`;
        f.style.left = `${30 + Math.random() * 40}%`;
        tap.appendChild(f);
        setTimeout(() => f.remove(), 700);
      }
      this._render(false);
      return;
    }
    const up = e.target.closest("[data-up]");
    if (up) { if (gs.specialUpgrade(Number(up.dataset.up))) this._render(true); }
  }

  _render(full) {
    if (!this.ov) return;
    const gs = this.gameState;
    const st = gs.specialState();
    if (!st.open) { this.close(); return; }
    const sp = st.sp;
    const next = SPECIAL_TIERS.find((t) => !sp.tiers[t.id]);
    const prevNeed = next ? ([...SPECIAL_TIERS].reverse().find((t) => sp.tiers[t.id])?.need || 0) : 0;
    const ratio = next ? Math.min(1, (sp.total - prevNeed) / (next.need - prevNeed)) : 1;
    if (!full && this._shell) {
      // 숫자만 갱신
      this.ov.querySelector("[data-k=votes]").textContent = shortNumber(sp.votes);
      this.ov.querySelector("[data-k=rate]").textContent = `초당 ${shortNumber(st.perSec)} · 탭 +${shortNumber(st.tapValue)}`;
      this.ov.querySelector("[data-k=bar]").style.transform = `scaleX(${ratio.toFixed(3)})`;
      this.ov.querySelector("[data-k=next]").textContent = next ? `${next.name}까지 ${shortNumber(Math.max(0, next.need - sp.total))}` : "최고 등급 달성";
      SPECIAL_STATIONS.forEach((_, i) => {
        const b = this.ov.querySelector(`[data-up="${i}"]`);
        if (!b) return;
        const can = gs.specialStationUnlocked(i) && sp.votes >= gs.specialStationCost(i);
        b.classList.toggle("gp-btn--disabled", !can);
        b.classList.toggle("gp-btn--ready", can);
      });
      const tierSig = Object.keys(sp.tiers).join(",");
      if (tierSig !== this._tierSig) this._render(true);
      return;
    }
    this._tierSig = Object.keys(sp.tiers).join(",");
    const stations = SPECIAL_STATIONS.map((s, i) => {
      const lv = sp.stations[i] || 0;
      const unlocked = gs.specialStationUnlocked(i);
      const cost = gs.specialStationCost(i);
      const can = unlocked && sp.votes >= cost;
      return `<div class="gp-special__st${unlocked ? "" : " gp-special__st--lock"}">
        <span class="gp-special__ic">${iconHtml(s.icon, { size: 40 })}</span>
        <span class="gp-special__stbody"><b>${st.theme.stations[i]} Lv.${lv}</b><small>${unlocked ? `초당 +${s.base} 특표/레벨` : `${st.theme.stations[i - 1]} Lv.${s.needPrev} 필요`}</small></span>
        <button class="gp-btn gp-btn--sm gp-btn--gold ${can ? "gp-btn--ready" : "gp-btn--disabled"}" data-up="${i}">${unlocked ? `${shortNumber(cost)}` : "잠김"}</button>
      </div>`;
    }).join("");
    const tiers = SPECIAL_TIERS.map((t) => `<div class="gp-special__tier${sp.tiers[t.id] ? " gp-special__tier--got" : ""}"><b>${t.name}</b><small>${shortNumber(t.need)}</small><em>${rewardText(t.reward)}</em></div>`).join("");
    const hist = (gs.data.specialHistory || []).slice(-3).reverse().map((h) => `<span class="gp-badge gp-badge--${h.tier}">${h.theme.replace(" 개표소", "")} ${TIER_LABEL[h.tier]}</span>`).join("");
    this.ov.innerHTML = `<div class="gp-map gp-special">
      <div class="gp-map__hd"><span>${iconHtml("ui-trophy", { size: 32 })}${st.theme.name}</span><button class="gp-map__x" data-k="x" aria-label="닫기">✕</button></div>
      <div class="gp-map__sub">${st.daysLeft}일 남음 · 종료 시 특표는 사라지고 등급 보상만 남습니다</div>
      <div class="gp-map__list">
        <div class="gp-special__top"><b data-k="votes">${shortNumber(sp.votes)}</b><span>특표</span><small data-k="rate">초당 ${shortNumber(st.perSec)} · 탭 +${shortNumber(st.tapValue)}</small></div>
        <button class="gp-special__tap" data-k="tap">개표!</button>
        <div class="gp-special__prog"><div class="gp-progress"><div class="gp-progress__fill" data-k="bar" style="transform:scaleX(${ratio.toFixed(3)})"></div></div><small data-k="next">${next ? `${next.name}까지 ${shortNumber(Math.max(0, next.need - sp.total))}` : "최고 등급 달성"}</small></div>
        <div class="gp-special__tiers">${tiers}</div>
        ${stations}
        ${hist ? `<div class="gp-special__hist">지난 기록 ${hist}</div>` : ""}
      </div>
    </div>`;
    this._shell = true;
  }
}
