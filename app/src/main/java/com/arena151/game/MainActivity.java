package com.arena151.game;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.provider.MediaStore;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Arena 151 for Android.
 *
 * The game itself is the same single-file HTML5 build used on desktop, bundled in
 * app/src/main/assets/index.html. It is served through WebViewAssetLoader from a stable
 * https origin, so browser storage (autosaves) persists and custom sprites in
 * assets/sprites/ load like normal web images.
 *
 * The page detects window.AndroidApp and switches to its touch layout.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";
    private static final int FILE_CHOOSER_REQUEST = 1151;

    private WebView web;
    private ValueCallback<Uri[]> pendingChooser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Allow chrome://inspect debugging on debug builds only.
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        web.setBackgroundColor(0xFF0C1120);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // autosaves and save slots
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);                  // everything comes through the asset loader
        s.setAllowContentAccess(true);                // needed to read a chosen save file
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);                           // ignore the system font-size setting so the HUD fits

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Keep the game inside the app; ignore any other navigation.
                String host = request.getUrl().getHost();
                return host == null || !host.equals(HOST);
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                // "Open save file" in the game menu
                if (pendingChooser != null) pendingChooser.onReceiveValue(null);
                pendingChooser = callback;
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(pick, "Open Arena 151 save file"), FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    pendingChooser = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "AndroidApp");
        setContentView(web);
        goImmersive();
        web.loadUrl(START_URL);
    }

    /** Methods callable from the game as window.AndroidApp.* */
    public class Bridge {

        /** Lists the files bundled in any assets folder (sprites, music, cry) as a JSON array. */
        @JavascriptInterface
        public String listAssets(String dir) {
            StringBuilder out = new StringBuilder("[");
            try {
                String[] names = getAssets().list(dir.replaceAll("[^A-Za-z0-9_-]", ""));
                if (names != null) for (int i = 0; i < names.length; i++) {
                    if (i > 0) out.append(',');
                    out.append('"').append(names[i].replace("\\", "\\\\").replace("\"", "\\\"")).append('"');
                }
            } catch (Exception e) { /* missing folder: empty list */ }
            return out.append(']').toString();
        }

        /** Lists the files bundled in assets/sprites as a JSON array, so new trainer files appear automatically. */
        @JavascriptInterface
        public String listSprites() {
            StringBuilder out = new StringBuilder("[");
            try {
                String[] names = getAssets().list("sprites");
                if (names != null) for (int i = 0; i < names.length; i++) {
                    if (i > 0) out.append(',');
                    out.append('"').append(names[i].replace("\\", "\\\\").replace("\"", "\\\"")).append('"');
                }
            } catch (Exception e) { /* no folder: empty list */ }
            return out.append(']').toString();
        }

        /** Writes a save file to Downloads/Arena151 and returns where it went ("" on failure). */
        @JavascriptInterface
        public String saveFile(String name, String text) {
            String safe = name.replaceAll("[^A-Za-z0-9._-]", "_");
            byte[] data = text.getBytes(StandardCharsets.UTF_8);
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, safe);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Arena151");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) return "";
                    try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                        if (out == null) return "";
                        out.write(data);
                    }
                    return "Downloads/Arena151/" + safe;
                } else {
                    // Android 8–9: app-specific Downloads folder (no storage permission needed)
                    File dir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Arena151");
                    if (!dir.exists() && !dir.mkdirs()) return "";
                    File f = new File(dir, safe);
                    try (FileOutputStream out = new FileOutputStream(f)) {
                        out.write(data);
                    }
                    return f.getAbsolutePath();
                }
            } catch (Exception e) {
                return "";
            }
        }

        /** Short haptic pulse for crits, knockouts and Mega Evolution. */
        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void vibrate(int ms) {
            Vibrator vib;
            if (Build.VERSION.SDK_INT >= 31) {
                VibratorManager vm = (VibratorManager) getSystemService(VIBRATOR_MANAGER_SERVICE);
                vib = vm == null ? null : vm.getDefaultVibrator();
            } else {
                vib = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            }
            if (vib == null || !vib.hasVibrator()) return;
            int d = Math.max(5, Math.min(ms, 300));
            vib.vibrate(VibrationEffect.createOneShot(d, VibrationEffect.DEFAULT_AMPLITUDE));
        }

        @JavascriptInterface
        public boolean isApp() {
            return true;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (pendingChooser != null) {
                Uri[] result = null;
                if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
                pendingChooser.onReceiveValue(result);
                pendingChooser = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    /** Back: closes the menu, then pauses the battle, then exits. The game decides. */
    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web == null) {
            super.onBackPressed();
            return;
        }
        web.evaluateJavascript("window.appBack ? appBack() : 'exit'", value -> {
            if (value == null || value.contains("exit")) finish();
        });
    }

    @Override
    protected void onPause() {
        // Pause the fight and autosave when the app goes to the background.
        if (web != null) {
            web.evaluateJavascript("window.appPaused && appPaused()", null);
            web.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        goImmersive();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) goImmersive();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.removeJavascriptInterface("AndroidApp");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    /** Full screen: hide status and navigation bars; a swipe from the edge shows them briefly. */
    @SuppressWarnings("deprecation")
    private void goImmersive() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }
}
