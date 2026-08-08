package kr.gaepyo.counting;

import android.content.Context;
import android.content.SharedPreferences;

final class DurableSaveStore {
    static final String PREFERENCES_NAME = "gaepyo_durable_save";
    static final String SAVE_KEY = "game_save_v1";
    static final int MAX_SAVE_LENGTH = 1_000_000;

    private final SharedPreferences preferences;

    DurableSaveStore(Context context) {
        preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    boolean write(String json) {
        if (json == null || json.isEmpty() || json.length() > MAX_SAVE_LENGTH) {
            return false;
        }
        return preferences.edit().putString(SAVE_KEY, json).commit();
    }

    String read() {
        return preferences.getString(SAVE_KEY, null);
    }

    boolean clear() {
        return preferences.edit().remove(SAVE_KEY).commit();
    }
}
