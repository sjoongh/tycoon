export class DOMUpdatePrompt {
  constructor(gameState, controller) {
    this.gameState = gameState;
    this.controller = controller;
    this.root = document.createElement("aside");
    this.root.className = "gp-update";
    this.root.hidden = true;
    this.root.setAttribute("role", "status");
    this.root.setAttribute("aria-live", "polite");
    this.root.setAttribute("aria-label", "새 공문 업데이트");
    this._render = () => this.render();
    this._blockTimer = null;
    this._click = (event) => this.onClick(event);
  }

  mount(parent) {
    this.parent = parent;
    parent.appendChild(this.root);
    this.root.addEventListener("click", this._click);
    this.controller.addEventListener("change", this._render);
    this.render();
  }

  // 보상·승격·작전 팝업이나 최종 검증이 떠 있는 동안에는 갱신 제안을 미룬다(팝업 위에 겹쳐 버튼을 가렸다).
  // 갱신이 이미 진행 중이면 가리지 않고 보여 준다.
  _blocked() {
    return !!this.parent?.querySelector(".gp-modal-ov, .gp-boss");
  }

  _watchBlock(on) {
    if (on && !this._blockTimer) this._blockTimer = setInterval(this._render, 400);
    if (!on && this._blockTimer) { clearInterval(this._blockTimer); this._blockTimer = null; }
  }

  render() {
    const offer = this.controller.ready && !this.controller.refreshing;
    this._watchBlock(offer); // 제안이 살아 있는 동안만 팝업 여닫힘을 확인한다
    const visible = this.controller.refreshing || (offer && !this._blocked());
    if (this.root.hidden === !visible && this._shownState === this._stateKey()) return;
    this._shownState = this._stateKey();
    this.root.hidden = !visible;
    this.root.classList.toggle("gp-update--busy", this.controller.refreshing);
    if (!visible) return;
    this.root.innerHTML = this.controller.refreshing
      ? `<b>안전하게 갱신 중</b><span>진행을 저장하고 새 공문을 적용하고 있습니다…</span>`
      : `<b>새 공문 도착</b><span>${this.controller.error || "진행을 저장한 뒤 최신 개표국으로 바꿀까요?"}</span><div><button data-update="later">나중에</button><button data-update="apply">지금 갱신</button></div>`;
  }

  _stateKey() {
    return `${this.controller.refreshing ? "r" : this.controller.ready ? "o" : "-"}|${this.controller.error || ""}`;
  }

  async onClick(event) {
    const action = event.target.closest("[data-update]")?.dataset.update;
    if (action === "later") this.controller.dismiss();
    if (action === "apply") await this.controller.apply();
  }

  destroy() {
    this._watchBlock(false);
    this.root.removeEventListener("click", this._click);
    this.controller.removeEventListener("change", this._render);
    this.root.remove();
  }
}
