package com.barcostop.app.core.auth;

import android.app.Activity;
import android.content.Intent;

import com.barcostop.app.BuildConfig;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public final class GoogleAuthHelper {
    private GoogleAuthHelper() {
    }

    public static Result prepareGoogleLogin(Activity activity) {
        String webClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID == null ? "" : BuildConfig.GOOGLE_WEB_CLIENT_ID.trim();
        if (webClientId.isEmpty()) {
            return Result.error("Google Login no configurado. Rellena GOOGLE_WEB_CLIENT_ID en credentials.ttb.properties.");
        }

        GoogleSignInOptions options = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestIdToken(webClientId)
                .build();

        GoogleSignInClient client = GoogleSignIn.getClient(activity, options);
        Intent intent = client.getSignInIntent();
        return Result.success(intent);
    }

    public static String parseIdToken(Intent data) throws ApiException {
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        GoogleSignInAccount account = task.getResult(ApiException.class);
        if (account == null || account.getIdToken() == null) {
            throw new ApiException(com.google.android.gms.common.api.Status.RESULT_INTERNAL_ERROR);
        }
        return account.getIdToken().trim();
    }

    public static final class Result {
        public final boolean ok;
        public final Intent intent;
        public final String message;

        private Result(boolean ok, Intent intent, String message) {
            this.ok = ok;
            this.intent = intent;
            this.message = message;
        }

        public static Result success(Intent intent) {
            return new Result(true, intent, "");
        }

        public static Result error(String message) {
            return new Result(false, null, message);
        }
    }
}
