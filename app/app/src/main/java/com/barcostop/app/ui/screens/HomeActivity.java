package com.barcostop.app.ui.screens;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.barcostop.app.BuildConfig;
import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.auth.AuthSessionManager;
import com.barcostop.app.core.i18n.LocaleManager;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.feedback.FeedbackFx;

public class HomeActivity extends AppCompatActivity {
    public static final String EXTRA_ROLE = "role";
    public static final String ROLE_PATRON = "patron";
    public static final String ROLE_VIAJERO = "viajero";

    private SessionStore sessionStore;
    private AuthSessionManager authSessionManager;
    private Button continueButton;
    private Button logoutButton;
    private TextView calloutView;
    private boolean launchingMain = false;
    private int calloutIndex = 0;
    private final Handler calloutHandler = new Handler(Looper.getMainLooper());
    private final Runnable calloutRunnable = new Runnable() {
        @Override
        public void run() {
            if (calloutView == null) return;
            String[] items = getResources().getStringArray(R.array.home_callouts);
            if (items.length == 0) return;
            calloutIndex = (calloutIndex + 1) % items.length;
            calloutView.setAlpha(0f);
            calloutView.setText(items[calloutIndex]);
            calloutView.animate().alpha(1f).setDuration(180).start();
            calloutHandler.postDelayed(this, 2200);
        }
    };

    @Override
    protected void attachBaseContext(Context newBase) {
        Context localized = LocaleManager.applyLocale(newBase, readLanguageFromPrefs(newBase));
        super.attachBaseContext(localized);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        sessionStore = app.getSessionStore();
        authSessionManager = new AuthSessionManager(sessionStore);

        continueButton = findViewById(R.id.btn_continue_session);
        logoutButton = findViewById(R.id.btn_logout);
        Button startCaptainButton = findViewById(R.id.btn_start_captain);
        Button startTravelerButton = findViewById(R.id.btn_start_traveler);
        Button langEn = findViewById(R.id.home_lang_en);
        Button langEs = findViewById(R.id.home_lang_es);
        Button langFr = findViewById(R.id.home_lang_fr);
        Button langPt = findViewById(R.id.home_lang_pt);
        TextView buildInfo = findViewById(R.id.home_build_info);
        calloutView = findViewById(R.id.home_callout);

        startCaptainButton.setOnClickListener(v -> openAuth(ROLE_PATRON));
        startTravelerButton.setOnClickListener(v -> openAuth(ROLE_VIAJERO));
        langEn.setOnClickListener(v -> switchLanguage(LocaleManager.LANG_EN));
        langEs.setOnClickListener(v -> switchLanguage(LocaleManager.LANG_ES));
        langFr.setOnClickListener(v -> switchLanguage(LocaleManager.LANG_FR));
        langPt.setOnClickListener(v -> switchLanguage(LocaleManager.LANG_PT));
        continueButton.setOnClickListener(v -> openMainApp(true));
        logoutButton.setOnClickListener(v -> {
            authSessionManager.clearSession();
            refreshSessionUi();
            FeedbackFx.info(this, R.string.home_logout);
        });

        buildInfo.setText(getString(
                R.string.home_build_info,
                BuildConfig.VERSION_NAME,
                BuildConfig.VERSION_CODE,
                BuildConfig.BUILD_DATE_UTC
        ));
        startCalloutRotation();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (authSessionManager.hasActiveSession()) {
            openMainApp(true);
            return;
        }
        launchingMain = false;
        refreshSessionUi();
        startCalloutRotation();
    }

    @Override
    protected void onPause() {
        super.onPause();
        calloutHandler.removeCallbacks(calloutRunnable);
    }

    private void openAuth(String role) {
        Intent intent = new Intent(this, AuthActivity.class);
        intent.putExtra(EXTRA_ROLE, role);
        startActivity(intent);
    }

    private void openMainApp(boolean clearTask) {
        if (launchingMain) return;
        launchingMain = true;
        Intent intent = new Intent(this, MainAppActivity.class);
        if (clearTask) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        }
        startActivity(intent);
    }

    private void switchLanguage(String languageCode) {
        sessionStore.saveLanguage(LocaleManager.normalize(languageCode));
        Intent refresh = new Intent(this, HomeActivity.class);
        refresh.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(refresh);
        finish();
    }

    private void refreshSessionUi() {
        boolean hasSession = authSessionManager.hasActiveSession();
        continueButton.setVisibility(hasSession ? View.VISIBLE : View.GONE);
        logoutButton.setVisibility(hasSession ? View.VISIBLE : View.GONE);
    }

    private void startCalloutRotation() {
        if (calloutView == null) return;
        String[] items = getResources().getStringArray(R.array.home_callouts);
        if (items.length == 0) return;
        calloutIndex = Math.max(0, Math.min(calloutIndex, items.length - 1));
        calloutView.setText(items[calloutIndex]);
        calloutHandler.removeCallbacks(calloutRunnable);
        calloutHandler.postDelayed(calloutRunnable, 2200);
    }

    private static String readLanguageFromPrefs(Context context) {
        return context
                .getSharedPreferences("barcostop_session", Context.MODE_PRIVATE)
                .getString("lang", LocaleManager.LANG_ES);
    }
}
