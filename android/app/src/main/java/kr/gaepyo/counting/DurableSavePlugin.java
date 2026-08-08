package kr.gaepyo.counting;

import android.webkit.JavascriptInterface;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DurableSave")
public final class DurableSavePlugin extends Plugin {
    static final String JAVASCRIPT_INTERFACE = "GaepyoSaveBridge";

    private DurableSaveStore store;

    @Override
    public void load() {
        store = new DurableSaveStore(getContext().getApplicationContext());
        bridge.getWebView().addJavascriptInterface(this, JAVASCRIPT_INTERFACE);
        super.load();
    }

    @JavascriptInterface
    public boolean write(String json) {
        return store != null && store.write(json);
    }

    @JavascriptInterface
    public String read() {
        return store == null ? null : store.read();
    }

    @JavascriptInterface
    public boolean clear() {
        return store != null && store.clear();
    }
}
