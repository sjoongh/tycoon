package kr.gaepyo.counting;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Plugin.load()에서 인터페이스를 등록해야 첫 WebView 문서 실행 전부터 동기 세이브를 읽을 수 있다.
        registerPlugin(DurableSavePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
