package ai.haheho.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.CapConfig;
import com.getcapacitor.Logger;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/**
 * Shared by both apps (haheho + inpatient flavors).
 *
 * The web config (server URL, base user agent "HahehoApp/x.y", plugins) comes
 * from capacitor.config.ts via `npx cap sync` and is the same for every
 * flavor. The only per-app difference is BuildConfig.USER_AGENT_TAG, which is
 * appended after the base user agent so the server can tell the apps apart
 * (e.g. "... HahehoApp/0.1 HahehoInpatient"). The base "HahehoApp/" marker is
 * always kept: the server detects the native app by it.
 */
public class MainActivity extends BridgeActivity {

    private static final String CONFIG_FILE = "capacitor.config.json";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (!BuildConfig.USER_AGENT_TAG.isEmpty()) {
            // Must be set before super.onCreate(), which builds the bridge.
            // null (on any error) falls back to the plain synced config.
            config = configWithUserAgentTag(BuildConfig.USER_AGENT_TAG);
        }
        super.onCreate(savedInstanceState);
        createNotificationChannel();
    }

    /**
     * The channel push notifications arrive on (AndroidManifest:
     * default_notification_channel_id). HIGH importance so they pop up as a
     * banner — Firebase's built-in fallback channel only shows them in the
     * notification shade. A channel's importance is fixed once created, so
     * changing it later needs a new channel ID.
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            getString(R.string.notification_channel_id),
            getString(R.string.notification_channel_name),
            NotificationManager.IMPORTANCE_HIGH);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    /** The synced capacitor.config.json with `tag` appended to the user agent. */
    private CapConfig configWithUserAgentTag(String tag) {
        try {
            JSONObject json = new JSONObject(readAsset(CONFIG_FILE));
            appendTag(json, tag);
            JSONObject android = json.optJSONObject("android");
            if (android != null && android.has("appendUserAgent")) {
                appendTag(android, tag);
            }

            File dir = new File(getFilesDir(), "capacitor-config");
            if (!dir.isDirectory() && !dir.mkdirs()) {
                throw new IllegalStateException("cannot create " + dir);
            }
            try (FileOutputStream out = new FileOutputStream(new File(dir, CONFIG_FILE))) {
                out.write(json.toString().getBytes(StandardCharsets.UTF_8));
            }
            return CapConfig.loadFromFile(this, dir.getAbsolutePath());
        } catch (Exception e) {
            Logger.error("Could not add user agent tag; using default config", e);
            return null;
        }
    }

    private static void appendTag(JSONObject obj, String tag) throws Exception {
        String base = obj.optString("appendUserAgent", "").trim();
        obj.put("appendUserAgent", base.isEmpty() ? tag : base + " " + tag);
    }

    private String readAsset(String name) throws Exception {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int n;
            while ((n = in.read(chunk)) != -1) buf.write(chunk, 0, n);
            return buf.toString("UTF-8");
        }
    }
}
