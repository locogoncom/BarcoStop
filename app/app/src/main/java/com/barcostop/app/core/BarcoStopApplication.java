package com.barcostop.app.core;

import android.app.Application;
import android.content.Context;

import com.barcostop.app.core.i18n.LocaleManager;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.storage.SessionStore;

public class BarcoStopApplication extends Application {
    private SessionStore sessionStore;
    private ApiClient apiClient;

    @Override
    public void onCreate() {
        super.onCreate();
        sessionStore = new SessionStore(this);
        apiClient = new ApiClient(sessionStore);
    }

    @Override
    protected void attachBaseContext(Context base) {
        SessionStore store = new SessionStore(base);
        Context localized = LocaleManager.applyLocale(base, store.getLanguage());
        super.attachBaseContext(localized);
    }

    public SessionStore getSessionStore() {
        return sessionStore;
    }

    public ApiClient getApiClient() {
        return apiClient;
    }
}
