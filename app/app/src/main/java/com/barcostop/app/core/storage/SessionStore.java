package com.barcostop.app.core.storage;

import android.content.Context;
import android.content.SharedPreferences;

public class SessionStore {
    private static final String PREFS = "barcostop_session";
    private static final String KEY_TOKEN = "auth_token";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_NAME = "name";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_ROLE = "role";
    private static final String KEY_LANG = "lang";

    private final SharedPreferences prefs;

    public SessionStore(Context context) {
        this.prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public void saveSession(String token, String userId, String name, String email, String role) {
        prefs.edit()
                .putString(KEY_TOKEN, token)
                .putString(KEY_USER_ID, userId)
                .putString(KEY_NAME, name)
                .putString(KEY_EMAIL, email)
                .putString(KEY_ROLE, role)
                .apply();
    }

    public void clearSession() {
        prefs.edit().clear().apply();
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, null);
    }

    public String getUserId() {
        return prefs.getString(KEY_USER_ID, null);
    }

    public String getRole() {
        return prefs.getString(KEY_ROLE, null);
    }

    public String getName() {
        return prefs.getString(KEY_NAME, null);
    }

    public String getEmail() {
        return prefs.getString(KEY_EMAIL, null);
    }

    public void saveLanguage(String languageCode) {
        prefs.edit().putString(KEY_LANG, languageCode).apply();
    }

    public String getLanguage() {
        return prefs.getString(KEY_LANG, "es");
    }
}
