package com.barcostop.app.core.util;

public final class TripTextSanitizer {
    private static final String BSMETA_MARKER = "[BSMETA]";

    private TripTextSanitizer() {
    }

    public static String stripBsMeta(String raw) {
        if (raw == null) return "";
        String value = raw.trim();
        if (value.isEmpty()) return "";
        int marker = value.indexOf(BSMETA_MARKER);
        if (marker >= 0) {
            value = value.substring(0, marker).trim();
        }
        return value;
    }
}
