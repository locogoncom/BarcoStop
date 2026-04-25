package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class FavoriteActions {
    private final ApiClient apiClient;

    public FavoriteActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void listFavorites(String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.FAVORITES + "/" + userId), callback);
    }

    public void addFavorite(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.FAVORITES);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void removeFavorite(String userId, String favoriteUserId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("DELETE", ApiEndpoints.FAVORITES + "/" + userId + "/" + favoriteUserId), callback);
    }
}
