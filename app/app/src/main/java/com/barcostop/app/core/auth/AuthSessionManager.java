package com.barcostop.app.core.auth;

import com.barcostop.app.core.security.JwtUtils;
import com.barcostop.app.core.storage.SessionStore;

import org.json.JSONObject;

public class AuthSessionManager {
    private final SessionStore sessionStore;

    public AuthSessionManager(SessionStore sessionStore) {
        this.sessionStore = sessionStore;
    }

    public boolean hasActiveSession() {
        String token = sessionStore.getToken();
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        if (JwtUtils.isExpired(token) || !JwtUtils.hasExpectedClaims(token)) {
            clearSession();
            return false;
        }

        return sessionStore.getUserId() != null && sessionStore.getRole() != null;
    }

    public void saveFromLoginResponse(String rawJson) throws Exception {
        JSONObject data = new JSONObject(rawJson);
        String token = data.optString("token", "").trim();
        String userId = readFirstNonBlank(data, "userId", "user_id");
        String name = readFirstNonBlank(data, "name", "username");
        String email = readFirstNonBlank(data, "email");
        String role = normalizeRole(readFirstNonBlank(data, "role"));

        if (token.isEmpty() || userId.isEmpty() || email.isEmpty() || role.isEmpty()) {
            throw new IllegalStateException("Invalid session payload");
        }

        if (JwtUtils.isExpired(token) || !JwtUtils.hasExpectedClaims(token)) {
            throw new SecurityException("Invalid token");
        }

        sessionStore.saveSession(token, userId, name, email, role);
    }

    public void clearSession() {
        sessionStore.clearSession();
    }

    public String getRole() {
        return safe(sessionStore.getRole());
    }

    public String getDisplayName() {
        String name = safe(sessionStore.getName());
        if (!name.isEmpty()) return name;
        return safe(sessionStore.getEmail());
    }

    private static String readFirstNonBlank(JSONObject data, String... keys) {
        for (String key : keys) {
            String value = data.optString(key, "").trim();
            if (!value.isEmpty()) return value;
        }
        return "";
    }

    private static String normalizeRole(String role) {
        String value = safe(role).toLowerCase();
        if (value.equals("patron") || value.equals("captain") || value.equals("capitan") || value.equals("patrón")) {
            return "patron";
        }
        if (value.equals("viajero") || value.equals("traveler")) {
            return "viajero";
        }
        return "";
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
