// 안드로이드(Capacitor) 네이티브 통합 — 웹에서는 전부 no-op(Capacitor.isNativePlatform()==false).
// 상태바·스플래시·뒤로가기 버튼 처리. 게임 코드와 분리해 웹 빌드에 영향 없게.
import { Capacitor } from "@capacitor/core";

export async function initNative() {
  if (!Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;

  // 상태바: 다크 테마, 게임 배경색에 맞춤(웹뷰 위에 안 겹치게)
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#14121c" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {}

  // 스플래시: 게임 준비됐으니 숨김
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {}

  // 안드로이드 뒤로가기: 모달 열려 있으면 닫고, 아니면 앱을 백그라운드로(홈처럼) — 실수 종료/데이터 손실 방지
  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", () => {
      const ov = document.querySelector(".gp-modal-ov, .gp-map-ov");
      if (ov) {
        const x = ov.querySelector("[data-close], .gp-map__x, .gp-dexdt__x, [data-confirm]");
        if (x) x.click(); else ov.remove();
        return;
      }
      const dt = document.querySelector(".gp-dexdt");
      if (dt) { const x = dt.querySelector(".gp-dexdt__x"); if (x) x.click(); else dt.remove(); return; }
      App.minimizeApp(); // 모달 없으면 백그라운드(종료 대신)
    });
    // 앱이 백그라운드↔포그라운드 전환 시 세이브 보장(데이터 손실 방지)
    App.addListener("pause", () => { try { window.__gpSave && window.__gpSave(); } catch {} });
  } catch {}
}
