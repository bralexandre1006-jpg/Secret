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
        requestHighRefreshRate();
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

    // Les WebView sont souvent bridées à 60 Hz sur HyperOS : on demande le mode d'affichage le plus rapide.
    private void requestHighRefreshRate() {
        try {
            if (Build.VERSION.SDK_INT < 23) return;
            Display d = Build.VERSION.SDK_INT >= 30 ? getDisplay() : getWindowManager().getDefaultDisplay();
            if (d == null) return;
            Display.Mode cur = d.getMode();
            Display.Mode best = cur;
            for (Display.Mode m : d.getSupportedModes()) {
                if (m.getPhysicalWidth() == cur.getPhysicalWidth() && m.getPhysicalHeight() == cur.getPhysicalHeight()
                        && m.getRefreshRate() > best.getRefreshRate()) best = m;
            }
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.preferredDisplayModeId = best.getModeId();
            lp.preferredRefreshRate = best.getRefreshRate();
            getWindow().setAttributes(lp);
        } catch (Exception ignored) {}
    }
}
