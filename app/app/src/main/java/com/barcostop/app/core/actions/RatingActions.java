package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class RatingActions {
    private final ApiClient apiClient;

    public RatingActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void listRatingsByUser(String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.RATINGS + "/user/" + userId), callback);
    }

    public void submitRating(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.RATINGS);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }
}
