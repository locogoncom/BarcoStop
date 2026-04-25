package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

import org.json.JSONObject;

public class AuthActions {
    private final ApiClient apiClient;

    public AuthActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void login(String email, String password, ApiCallback callback) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("email", email);
            payload.put("password", password);

            ApiRequest req = new ApiRequest("POST", ApiEndpoints.USERS_LOGIN);
            req.jsonBody = payload.toString();
            apiClient.execute(req, callback);
        } catch (Throwable throwable) {
            callback.onError(throwable);
        }
    }

    public void register(String name, String email, String password, String role, ApiCallback callback) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("name", name);
            payload.put("email", email);
            payload.put("password", password);
            payload.put("role", role);

            ApiRequest req = new ApiRequest("POST", ApiEndpoints.USERS);
            req.jsonBody = payload.toString();
            apiClient.execute(req, callback);
        } catch (Throwable throwable) {
            callback.onError(throwable);
        }
    }

    public void loginWithGoogle(String idToken, String role, ApiCallback callback) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("idToken", idToken);
            payload.put("role", role);

            ApiRequest req = new ApiRequest("POST", ApiEndpoints.USERS_LOGIN_GOOGLE);
            req.jsonBody = payload.toString();
            apiClient.execute(req, callback);
        } catch (Throwable throwable) {
            callback.onError(throwable);
        }
    }

    public void getGoogleAuthConfig(ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.AUTH_GOOGLE_CONFIG), callback);
    }
}
