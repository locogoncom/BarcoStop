package com.barcostop.app.core.network;

import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.core.security.JwtUtils;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;

public class ApiClient {
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final SessionStore sessionStore;
    private final OkHttpClient httpClient;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public ApiClient(SessionStore sessionStore) {
        this.sessionStore = sessionStore;

        HttpLoggingInterceptor logger = new HttpLoggingInterceptor();
        logger.setLevel(HttpLoggingInterceptor.Level.BODY);

        this.httpClient = new OkHttpClient.Builder()
                .addInterceptor(logger)
                .build();
    }

    public void execute(ApiRequest request, ApiCallback callback) {
        executor.execute(() -> {
            try {
                String url = ApiConfig.API_BASE_URL + request.path;
                Request.Builder builder = new Request.Builder().url(url);

                String token = sessionStore.getToken();
                if (token != null && !token.trim().isEmpty()) {
                    if (JwtUtils.isExpired(token)) {
                        sessionStore.clearSession();
                        callback.onError(new SecurityException("JWT_EXPIRED"));
                        return;
                    }
                    if (!JwtUtils.hasExpectedClaims(token)) {
                        sessionStore.clearSession();
                        callback.onError(new SecurityException("JWT_INVALID_CLAIMS"));
                        return;
                    }
                    builder.addHeader("Authorization", "Bearer " + token);
                }

                for (Map.Entry<String, String> entry : request.headers.entrySet()) {
                    builder.addHeader(entry.getKey(), entry.getValue());
                }

                RequestBody body = null;
                if (request.jsonBody != null) {
                    body = RequestBody.create(request.jsonBody, JSON);
                }

                String method = request.method.toUpperCase();
                switch (method) {
                    case "GET":
                        builder.get();
                        break;
                    case "DELETE":
                        if (body != null) {
                            builder.delete(body);
                        } else {
                            builder.delete();
                        }
                        break;
                    default:
                        builder.method(method, body != null ? body : RequestBody.create(new byte[0], null));
                        break;
                }

                try (Response response = httpClient.newCall(builder.build()).execute()) {
                    String responseBody = response.body() != null ? response.body().string() : "";
                    if (!response.isSuccessful()) {
                        callback.onError(new IOException("HTTP " + response.code() + " - " + responseBody));
                        return;
                    }
                    callback.onSuccess(responseBody);
                }
            } catch (Throwable throwable) {
                callback.onError(throwable);
            }
        });
    }
}
