package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class UserActions {
    private final ApiClient apiClient;

    public UserActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void getUsers(ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.USERS), callback);
    }

    public void getUserById(String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.USERS + "/" + userId), callback);
    }

    public void updateUser(String userId, String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("PATCH", ApiEndpoints.USERS + "/" + userId);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }
}
