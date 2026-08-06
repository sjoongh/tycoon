import { describe, expect, it, vi } from "vitest";
import { ServiceWorkerUpdateController } from "./ServiceWorkerUpdateController.js";

class FakeWorker extends EventTarget {
  constructor(state = "installing") {
    super();
    this.state = state;
    this.postMessage = vi.fn();
  }
}

class FakeRegistration extends EventTarget {
  constructor() {
    super();
    this.installing = null;
    this.waiting = null;
    this.update = vi.fn(async () => {});
  }
}

class FakeServiceWorker extends EventTarget {
  constructor(registration) {
    super();
    this.controller = {};
    this.registration = registration;
    this.register = vi.fn(async () => registration);
  }
}

describe("ServiceWorkerUpdateController", () => {
  it("대기 중인 새 워커를 발견해도 사용자 선택 전에는 활성화하지 않는다", async () => {
    const registration = new FakeRegistration();
    registration.waiting = new FakeWorker("installed");
    const serviceWorker = new FakeServiceWorker(registration);
    const controller = new ServiceWorkerUpdateController({ serviceWorker });

    await controller.register();

    expect(controller.ready).toBe(true);
    expect(registration.waiting.postMessage).not.toHaveBeenCalled();
    expect(controller.dismiss()).toBe(true);
    expect(controller.ready).toBe(false);
  });

  it("다른 탭이 워커를 활성화해도 이 탭은 사용자 선택 없이 강제 새로고침하지 않는다", async () => {
    const registration = new FakeRegistration();
    registration.waiting = new FakeWorker("installed");
    const serviceWorker = new FakeServiceWorker(registration);
    const save = vi.fn();
    const reload = vi.fn();
    const controller = new ServiceWorkerUpdateController({ serviceWorker, save, reload });
    await controller.register();

    serviceWorker.dispatchEvent(new Event("controllerchange"));

    expect(save).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("설치 완료 이벤트에서 업데이트 준비 상태를 알린다", async () => {
    const registration = new FakeRegistration();
    const serviceWorker = new FakeServiceWorker(registration);
    const controller = new ServiceWorkerUpdateController({ serviceWorker });
    const changes = vi.fn();
    controller.addEventListener("change", changes);
    await controller.register();
    registration.installing = new FakeWorker();

    registration.dispatchEvent(new Event("updatefound"));
    registration.installing.state = "installed";
    registration.installing.dispatchEvent(new Event("statechange"));

    expect(controller.ready).toBe(true);
    expect(changes).toHaveBeenCalledOnce();
  });

  it("지금 갱신은 저장 후 SKIP_WAITING을 보내고 controllerchange에 한 번만 reload한다", async () => {
    const registration = new FakeRegistration();
    registration.waiting = new FakeWorker("installed");
    const serviceWorker = new FakeServiceWorker(registration);
    const calls = [];
    const controller = new ServiceWorkerUpdateController({
      serviceWorker,
      save: async () => calls.push("save"),
      reload: () => calls.push("reload"),
    });
    await controller.register();

    const applying = controller.apply();
    expect(await controller.apply()).toBe(false);
    expect(await applying).toBe(true);
    expect(calls).toEqual(["save"]);
    expect(registration.waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(calls).toEqual(["save", "reload"]);
  });

  it("저장 실패 시 워커를 활성화하지 않고 다시 시도할 수 있다", async () => {
    const registration = new FakeRegistration();
    registration.waiting = new FakeWorker("installed");
    const serviceWorker = new FakeServiceWorker(registration);
    const controller = new ServiceWorkerUpdateController({
      serviceWorker,
      save: vi.fn(async () => { throw new Error("quota"); }),
    });
    await controller.register();

    expect(await controller.apply()).toBe(false);
    expect(controller.refreshing).toBe(false);
    expect(controller.ready).toBe(true);
    expect(controller.error).toContain("저장에 실패");
    expect(registration.waiting.postMessage).not.toHaveBeenCalled();
  });

  it("활성화 응답이 늦어도 적용 상태를 풀고 완료 시 한 번 reload한다", async () => {
    vi.useFakeTimers();
    const registration = new FakeRegistration();
    registration.waiting = new FakeWorker("installed");
    const serviceWorker = new FakeServiceWorker(registration);
    const controller = new ServiceWorkerUpdateController({
      serviceWorker,
      reload: vi.fn(),
      activationTimeoutMs: 100,
    });
    await controller.register();

    expect(await controller.apply()).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(controller.refreshing).toBe(false);
    expect(controller.ready).toBe(true);
    expect(controller.error).toContain("응답이 늦습니다");
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(controller.reload).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
