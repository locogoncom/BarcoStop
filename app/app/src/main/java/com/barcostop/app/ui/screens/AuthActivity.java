package com.barcostop.app.ui.screens;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.AuthActions;
import com.barcostop.app.core.auth.AuthSessionManager;
import com.barcostop.app.core.auth.GoogleAuthHelper;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.util.KeyboardUtils;
import com.google.android.gms.common.api.ApiException;

import org.json.JSONObject;

public class AuthActivity extends AppCompatActivity {
    private boolean isRegister = false;
    private String role = HomeActivity.ROLE_VIAJERO;

    private EditText nameInput;
    private EditText emailInput;
    private EditText passwordInput;
    private EditText confirmPasswordInput;
    private TextView titleView;
    private TextView orDividerView;
    private TextView roleView;
    private Button submitButton;
    private Button googleLoginButton;
    private Button toggleModeButton;
    private ProgressBar progressBar;

    private AuthActions authActions;
    private AuthSessionManager authSessionManager;
    private ActivityResultLauncher<Intent> googleSignInLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_auth);

        role = normalizeRole(getIntent().getStringExtra(HomeActivity.EXTRA_ROLE));

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        authActions = new AuthActions(app.getApiClient());
        authSessionManager = new AuthSessionManager(app.getSessionStore());
        googleSignInLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> handleGoogleSignInResult(result.getResultCode(), result.getData())
        );

        bindViews();
        setupListeners();
        renderMode();
    }

    private void bindViews() {
        titleView = findViewById(R.id.tv_auth_title);
        orDividerView = findViewById(R.id.tv_auth_or);
        roleView = findViewById(R.id.tv_auth_role);
        nameInput = findViewById(R.id.et_name);
        emailInput = findViewById(R.id.et_email);
        passwordInput = findViewById(R.id.et_password);
        confirmPasswordInput = findViewById(R.id.et_confirm_password);
        submitButton = findViewById(R.id.btn_submit);
        googleLoginButton = findViewById(R.id.btn_google_login);
        toggleModeButton = findViewById(R.id.btn_toggle_mode);
        progressBar = findViewById(R.id.progress);
    }

    private void setupListeners() {
        submitButton.setOnClickListener(v -> submit());
        googleLoginButton.setOnClickListener(v -> submitGoogleLogin());
        toggleModeButton.setOnClickListener(v -> {
            isRegister = !isRegister;
            confirmPasswordInput.setText("");
            renderMode();
        });
    }

    private void renderMode() {
        titleView.setText(isRegister ? R.string.auth_register : R.string.auth_login);
        roleView.setText(getRoleLabel());
        nameInput.setVisibility(isRegister ? View.VISIBLE : View.GONE);
        confirmPasswordInput.setVisibility(isRegister ? View.VISIBLE : View.GONE);
        orDividerView.setVisibility(isRegister ? View.GONE : View.VISIBLE);
        googleLoginButton.setVisibility(isRegister ? View.GONE : View.VISIBLE);
        submitButton.setText(isRegister ? R.string.auth_register : R.string.auth_login);
        toggleModeButton.setText(isRegister ? R.string.auth_have_account : R.string.auth_no_account);
    }

    private String getRoleLabel() {
        return role.equals(HomeActivity.ROLE_PATRON)
                ? getString(R.string.role_captain)
                : getString(R.string.role_traveler);
    }

    private void submit() {
        KeyboardUtils.hide(this, getCurrentFocus());
        String name = text(nameInput);
        String email = text(emailInput);
        String password = text(passwordInput);
        String confirmPassword = text(confirmPasswordInput);

        if (email.isEmpty() || password.isEmpty() || (isRegister && name.isEmpty())) {
            FeedbackFx.info(this, getString(R.string.auth_required));
            return;
        }

        if (isRegister && !password.equals(confirmPassword)) {
            FeedbackFx.info(this, getString(R.string.auth_password_mismatch));
            return;
        }

        setLoading(true);
        if (isRegister) {
            registerThenLogin(name, email, password);
            return;
        }

        login(email, password);
    }

    private void registerThenLogin(String name, String email, String password) {
        authActions.register(name, email, password, role, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                login(email, password);
            }

            @Override
            public void onUiError(Throwable throwable) {
                setLoading(false);
                showError(throwable);
            }
        });
    }

    private void login(String email, String password) {
        authActions.login(email, password, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    authSessionManager.saveFromLoginResponse(body);
                    setLoading(false);
                    Intent intent = new Intent(AuthActivity.this, MainAppActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    setLoading(false);
                    showError(e);
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                setLoading(false);
                showError(throwable);
            }
        });
    }

    private void submitGoogleLogin() {
        KeyboardUtils.hide(this, getCurrentFocus());
        setLoading(true);
        authActions.getGoogleAuthConfig(new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                String serverHint = parseGoogleConfigMessage(body);
                if (!serverHint.isEmpty()) {
                    FeedbackFx.info(AuthActivity.this, serverHint);
                }
                startGoogleSignInFlow();
            }

            @Override
            public void onUiError(Throwable throwable) {
                startGoogleSignInFlow();
            }
        });
    }

    private void startGoogleSignInFlow() {
        GoogleAuthHelper.Result prep = GoogleAuthHelper.prepareGoogleLogin(this);
        if (!prep.ok || prep.intent == null) {
            setLoading(false);
            FeedbackFx.info(this, prep.message);
            return;
        }
        googleSignInLauncher.launch(prep.intent);
    }

    private void handleGoogleSignInResult(int resultCode, Intent data) {
        if (resultCode != RESULT_OK || data == null) {
            setLoading(false);
            FeedbackFx.info(this, getString(R.string.auth_google_cancelled));
            return;
        }

        final String idToken;
        try {
            idToken = GoogleAuthHelper.parseIdToken(data);
        } catch (ApiException e) {
            setLoading(false);
            FeedbackFx.error(this, getString(R.string.auth_google_signin_error));
            return;
        }

        authActions.loginWithGoogle(idToken, role, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String loginBody) {
                try {
                    authSessionManager.saveFromLoginResponse(loginBody);
                    setLoading(false);
                    Intent intent = new Intent(AuthActivity.this, MainAppActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    setLoading(false);
                    showError(e);
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                setLoading(false);
                String fallback = getString(R.string.auth_google_backend_pending);
                String message = throwable != null && throwable.getMessage() != null && !throwable.getMessage().trim().isEmpty()
                        ? throwable.getMessage()
                        : fallback;
                FeedbackFx.error(AuthActivity.this, message);
            }
        });
    }

    private String parseGoogleConfigMessage(String body) {
        try {
            JSONObject json = new JSONObject(body);
            String message = json.optString("message", "").trim();
            boolean enabled = json.optBoolean("enabled", false);
            if (enabled) return "";
            return message;
        } catch (Throwable ignored) {
            return "";
        }
    }

    private void showError(Throwable throwable) {
        String message = throwable != null && throwable.getMessage() != null && !throwable.getMessage().trim().isEmpty()
                ? throwable.getMessage()
                : getString(R.string.auth_error_generic);
        FeedbackFx.error(this, message);
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        submitButton.setEnabled(!loading);
        googleLoginButton.setEnabled(!loading);
        toggleModeButton.setEnabled(!loading);
        nameInput.setEnabled(!loading);
        emailInput.setEnabled(!loading);
        passwordInput.setEnabled(!loading);
        confirmPasswordInput.setEnabled(!loading);
    }

    private static String text(EditText editText) {
        return editText.getText() == null ? "" : editText.getText().toString().trim();
    }

    private static String normalizeRole(String value) {
        if (value == null) return HomeActivity.ROLE_VIAJERO;
        String role = value.trim().toLowerCase();
        if (role.equals(HomeActivity.ROLE_PATRON)) return HomeActivity.ROLE_PATRON;
        return HomeActivity.ROLE_VIAJERO;
    }

    private abstract static class UiApiCallback implements com.barcostop.app.core.network.ApiCallback {
        private final AppCompatActivity activity;

        UiApiCallback(AppCompatActivity activity) {
            this.activity = activity;
        }

        @Override
        public final void onSuccess(String body) {
            activity.runOnUiThread(() -> onUiSuccess(body));
        }

        @Override
        public final void onError(Throwable throwable) {
            activity.runOnUiThread(() -> onUiError(throwable));
        }

        public abstract void onUiSuccess(String body);

        public abstract void onUiError(Throwable throwable);
    }
}
