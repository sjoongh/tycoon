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
    this._click = (event) => this.onClick(event);
  }

  mount(parent) {
    parent.appendChild(this.root);
    this.root.addEventListener("click", this._click);
    this.controller.addEventListener("change", this._render);
    this.render();
  }

  render() {
    const visible = this.controller.ready || this.controller.refreshing;
    this.root.hidden = !visible;
    if (!visible) return;
    this.root.innerHTML = this.controller.refreshing
      ? `<b>안전하게 갱신 중</b><span>진행을 저장하고 새 공문을 적용하고 있습니다…</span>`
      : `<b>새 공문 도착</b><span>${this.controller.error || "진행을 저장한 뒤 최신 개표국으로 바꿀까요?"}</span><div><button data-update="later">나중에</button><button data-update="apply">지금 갱신</button></div>`;
  }

  async onClick(event) {
    const action = event.target.closest("[data-update]")?.dataset.update;
    if (action === "later") this.controller.dismiss();
    if (action === "apply") await this.controller.apply();
  }

  destroy() {
    this.root.removeEventListener("click", this._click);
    this.controller.removeEventListener("change", this._render);
    this.root.remove();
  }
}
