package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class DonationActions {
    private final ApiClient apiClient;

    public DonationActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void getDonationsByUser(String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.DONATIONS + "/user/" + userId), callback);
    }

    public void createDonation(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.DONATIONS);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }
}
