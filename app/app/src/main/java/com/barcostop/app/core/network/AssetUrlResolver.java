package com.barcostop.app.core.network;

public final class AssetUrlResolver {
    private static final String FIXED_UPLOAD_BASE = "https://api.barcostop.net/storage/uploads/";

    private AssetUrlResolver() {}

    public static String resolve(String rawUrl) {
        String url = safe(rawUrl);
        if (url.isEmpty()) return "";

        String lower = url.toLowerCase();
        if (lower.contains("/uploads/")) {
            String tail = url.substring(lower.indexOf("/uploads/") + "/uploads/".length());
            return FIXED_UPLOAD_BASE + trimLeadingSlash(tail);
        }
        if (lower.contains("/storage/uploads/")) {
            String tail = url.substring(lower.indexOf("/storage/uploads/") + "/storage/uploads/".length());
            return FIXED_UPLOAD_BASE + trimLeadingSlash(tail);
        }
        // Legacy typo tolerance: still map malformed paths to canonical /storage/uploads/.
        if (lower.contains("/storage/uplloads/")) {
            String tail = url.substring(lower.indexOf("/storage/uplloads/") + "/storage/uplloads/".length());
            return FIXED_UPLOAD_BASE + trimLeadingSlash(tail);
        }
        if (lower.startsWith("uploads/")) {
            return FIXED_UPLOAD_BASE + trimLeadingSlash(url.substring("uploads/".length()));
        }
        if (lower.startsWith("/uploads/")) {
            return FIXED_UPLOAD_BASE + trimLeadingSlash(url.substring("/uploads/".length()));
        }

        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            return url;
        }

        String apiBase = safe(ApiConfig.API_BASE_URL);
        if (apiBase.isEmpty()) return url;

        String origin = apiBase;
        int apiMarker = origin.indexOf("/api/");
        if (apiMarker > 0) {
            origin = origin.substring(0, apiMarker);
        } else {
            origin = origin.replaceAll("/+$", "");
        }
        if (url.startsWith("/")) return origin + url;
        return origin + "/" + url;
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimLeadingSlash(String value) {
        if (value == null) return "";
        return value.replaceFirst("^/+", "");
    }
}
