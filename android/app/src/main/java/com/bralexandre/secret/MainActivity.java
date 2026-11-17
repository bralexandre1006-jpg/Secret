package com.bralexandre.secret;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.webkit.WebView;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VaultPlugin.class);
        super.onCreate(savedInstanceState);
        findBestMode();
        tuneWebView();
    }

    private void tuneWebView() {
        try {
            WebView wv = getBridge().getWebView();
            wv.getSettings().setOffscreenPreRaster(true);
            wv.setVerticalScrollBarEnabled(false);
            wv.setHorizontalScrollBarEnabled(false);
            if (Build.VERSION.SDK_INT >= 26) wv.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        } catch (Exception ignored) {}
    }

    // HyperOS bride souvent les WebView à 60 Hz. On ne monte au taux maximal que pendant
    // les interactions (demandé par le JS), puis on rend la main au mode adaptatif pour éviter la chauffe.
    private int bestModeId = 0;
    private float bestRate = 0f;
    private boolean high = false;

    private void findBestMode() {
        try {
            Display d = Build.VERSION.SDK_INT >= 30 ? getDisplay() : getWindowManager().getDefaultDisplay();
            if (d == null) return;
            Display.Mode cur = d.getMode();
            Display.Mode best = cur;
            for (Display.Mode m : d.getSupportedModes()) {
                if (m.getPhysicalWidth() == cur.getPhysicalWidth() && m.getPhysicalHeight() == cur.getPhysicalHeight()
                        && m.getRefreshRate() > best.getRefreshRate()) best = m;
            }
            bestModeId = best.getModeId();
            bestRate = best.getRefreshRate();
        } catch (Exception ignored) {}
    }

    public void setHighRefresh(boolean on) {
        runOnUiThread(() -> {
            try {
                if (on == high || bestModeId == 0) return;
                high = on;
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.preferredDisplayModeId = on ? bestModeId : 0;
                lp.preferredRefreshRate = on ? bestRate : 0f;
                getWindow().setAttributes(lp);
            } catch (Exception ignored) {}
        });
    }
}
