package com.barcostop.app.core.security;

import android.util.Base64;

import com.barcostop.app.BuildConfig;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;

public final class JwtUtils {
    private JwtUtils() {}

    public static Long getExpirationEpochSeconds(String jwt) {
        JSONObject payload = parsePayload(jwt);
        if (payload == null || !payload.has("exp")) return null;
        try {
            return payload.getLong("exp");
        } catch (Throwable ignored) {
            return null;
        }
    }

    public static boolean hasExpectedClaims(String jwt) {
        JSONObject payload = parsePayload(jwt);
        if (payload == null) return false;

        String expectedIssuer = safe(BuildConfig.JWT_EXPECTED_ISSUER);
        String expectedAudience = safe(BuildConfig.JWT_EXPECTED_AUDIENCE);

        if (!expectedIssuer.isEmpty()) {
            String tokenIssuer = safe(payload.optString("iss", ""));
            if (!expectedIssuer.equals(tokenIssuer)) return false;
        }

        if (!expectedAudience.isEmpty()) {
            String tokenAudience = safe(payload.optString("aud", ""));
            if (!expectedAudience.equals(tokenAudience)) return false;
        }

        return true;
    }

    private static JSONObject parsePayload(String jwt) {
        try {
            if (jwt == null || jwt.trim().isEmpty()) return null;
            String[] parts = jwt.split("\\.");
            if (parts.length < 2) return null;

            String payloadPart = parts[1];
            int padding = (4 - payloadPart.length() % 4) % 4;
            StringBuilder padded = new StringBuilder(payloadPart);
            for (int i = 0; i < padding; i++) padded.append('=');

            byte[] decoded = Base64.decode(padded.toString(), Base64.URL_SAFE);
            String json = new String(decoded, StandardCharsets.UTF_8);
            return new JSONObject(json);
        } catch (Throwable ignored) {
            return null;
        }
    }

    public static boolean isExpired(String jwt) {
        Long exp = getExpirationEpochSeconds(jwt);
        if (exp == null) return false;
        long now = System.currentTimeMillis() / 1000L;
        return now >= exp;
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
