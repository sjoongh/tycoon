package kr.gaepyo.counting;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class DurableSaveStoreInstrumentedTest {
    private Context context;
    private DurableSaveStore store;

    @Before
    public void setUp() {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        context.getSharedPreferences(DurableSaveStore.PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit();
        store = new DurableSaveStore(context);
    }

    @After
    public void tearDown() {
        context.getSharedPreferences(DurableSaveStore.PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit();
    }

    @Test
    public void writeReturnsAfterValueIsReadableFromFreshPreferencesInstance() {
        String json = "{\"lastSavedAt\":2000,\"facilities\":{\"desk\":2}}";

        assertTrue(store.write(json));

        DurableSaveStore freshStore = new DurableSaveStore(context);
        assertEquals(json, freshStore.read());
    }

    @Test
    public void clearReturnsAfterValueIsRemoved() {
        assertTrue(store.write("{\"lastSavedAt\":2000}"));

        assertTrue(store.clear());

        assertNull(new DurableSaveStore(context).read());
    }

    @Test
    public void invalidOrOversizedPayloadIsRejected() {
        String oversized = new String(new char[DurableSaveStore.MAX_SAVE_LENGTH + 1]).replace('\0', 'x');
        assertFalse(store.write(null));
        assertFalse(store.write(""));
        assertFalse(store.write(oversized));
        assertNull(store.read());
    }
}
