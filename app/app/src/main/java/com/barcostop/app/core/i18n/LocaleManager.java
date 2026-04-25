package com.barcostop.app.core.i18n;

import android.content.Context;
import android.content.res.Configuration;

import java.util.Locale;

public final class LocaleManager {
    public static final String LANG_ES = "es";
    public static final String LANG_EN = "en";
    public static final String LANG_FR = "fr";
    public static final String LANG_PT = "pt";

    private LocaleManager() {}

    public static Context applyLocale(Context context, String languageCode) {
        Locale locale = new Locale(normalize(languageCode));
        Locale.setDefault(locale);

        Configuration configuration = new Configuration(context.getResources().getConfiguration());
        configuration.setLocale(locale);
        return context.createConfigurationContext(configuration);
    }

    public static String normalize(String languageCode) {
        if (languageCode == null) return LANG_ES;
        switch (languageCode.trim().toLowerCase()) {
            case LANG_EN:
            case LANG_FR:
            case LANG_PT:
            case LANG_ES:
                return languageCode.trim().toLowerCase();
            default:
                return LANG_ES;
        }
    }
}
