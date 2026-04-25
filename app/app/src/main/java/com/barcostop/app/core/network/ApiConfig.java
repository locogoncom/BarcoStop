package com.barcostop.app.core.network;

import com.barcostop.app.BuildConfig;

public final class ApiConfig {
    private ApiConfig() {}

    public static final String API_BASE_URL = BuildConfig.API_BASE_URL;
    public static final String WS_URL = BuildConfig.WS_URL;
    public static final String APP_ENV = BuildConfig.APP_ENV;
    public static final int TIMEOUT_SECONDS = 20;
}
