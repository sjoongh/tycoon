package kr.gaepyo.counting;

import android.app.Activity;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

// 설정의 '화면 켜두기' — 게임을 보는 동안 화면이 자동으로 꺼지지 않게 한다(앱이 백그라운드로 가면 시스템이 자동 해제).
@CapacitorPlugin(name = "ScreenAwake")
public final class ScreenAwakePlugin extends Plugin {
    static final String JAVASCRIPT_INTERFACE = "GaepyoScreenBridge";

    @Override
    public void load() {
        bridge.getWebView().addJavascriptInterface(this, JAVASCRIPT_INTERFACE);
        super.load();
    }

    @JavascriptInterface
    public void setKeepOn(boolean on) {
        Activity activity = getActivity();
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            if (on) activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
    }
}
