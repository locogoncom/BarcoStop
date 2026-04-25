package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class SupportActions {
    private final ApiClient apiClient;

    public SupportActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void listSupportMessages(String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.SUPPORT_MESSAGES + "/user/" + userId), callback);
    }

    public void createSupportMessage(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.SUPPORT_MESSAGES);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void deleteSupportMessage(String id, ApiCallback callback) {
        apiClient.execute(new ApiRequest("DELETE", ApiEndpoints.SUPPORT_MESSAGES + "/" + id), callback);
    }
}
