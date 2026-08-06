export class ServiceWorkerUpdateController extends EventTarget {
  constructor({ serviceWorker, reload, save, activationTimeoutMs = 10000 } = {}) {
    super();
    this.serviceWorker = serviceWorker ?? globalThis.navigator?.serviceWorker ?? null;
    this.reload = reload ?? (() => globalThis.location?.reload?.());
    this.save = save ?? (() => {});
    this.registration = null;
    this.waitingWorker = null;
    this.dismissed = false;
    this.refreshing = false;
    this.error = "";
    this.activationTimeoutMs = activationTimeoutMs;
    this.activationListener = null;
    this.activationTimer = null;
  }

  get ready() {
    return !!this.waitingWorker && !this.dismissed;
  }

  async register(scriptUrl = "/sw.js") {
    if (!this.serviceWorker?.register) return null;
    const registration = await this.serviceWorker.register(scriptUrl);
    this.registration = registration;
    if (registration.waiting && this.serviceWorker.controller) this._setWaiting(registration.waiting);
    registration.addEventListener?.("updatefound", () => this._watchInstalling(registration.installing));
    return registration;
  }

  async check() {
    if (!this.registration?.update) return false;
    await this.registration.update();
    return true;
  }

  dismiss() {
    if (!this.waitingWorker) return false;
    this.dismissed = true;
    this.dispatchEvent(new Event("change"));
    return true;
  }

  async apply() {
    if (!this.waitingWorker || this.refreshing) return false;
    this.refreshing = true;
    this.error = "";
    this.dispatchEvent(new Event("change"));
    try {
      await this.save();
    } catch {
      this.refreshing = false;
      this.error = "진행 저장에 실패했습니다. 다시 시도해 주세요.";
      this.dispatchEvent(new Event("change"));
      return false;
    }
    let addedListener = false;
    if (!this.activationListener) {
      this.activationListener = () => {
        clearTimeout(this.activationTimer);
        this.activationTimer = null;
        this.activationListener = null;
        this.reload();
      };
      this.serviceWorker?.addEventListener?.("controllerchange", this.activationListener, { once: true });
      addedListener = true;
    }
    try {
      this.waitingWorker.postMessage?.({ type: "SKIP_WAITING" });
    } catch {
      if (addedListener) {
        this.serviceWorker?.removeEventListener?.("controllerchange", this.activationListener);
        this.activationListener = null;
      }
      this.refreshing = false;
      this.error = "업데이트 요청에 실패했습니다. 다시 시도해 주세요.";
      this.dispatchEvent(new Event("change"));
      return false;
    }
    clearTimeout(this.activationTimer);
    this.activationTimer = setTimeout(() => {
      this.activationTimer = null;
      this.refreshing = false;
      this.error = "업데이트 응답이 늦습니다. 다시 시도해 주세요.";
      this.dispatchEvent(new Event("change"));
    }, this.activationTimeoutMs);
    this.dispatchEvent(new Event("change"));
    return true;
  }

  _watchInstalling(worker) {
    if (!worker?.addEventListener) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && this.serviceWorker?.controller) this._setWaiting(worker);
    });
  }

  _setWaiting(worker) {
    this.waitingWorker = worker;
    this.dismissed = false;
    this.error = "";
    this.dispatchEvent(new Event("change"));
  }
}
