package com.barcostop.app.core.network;

public interface ApiCallback {
    void onSuccess(String body);
    void onError(Throwable throwable);
}
