package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class BoatActions {
    private final ApiClient apiClient;

    public BoatActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void listBoats(ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.BOATS), callback);
    }

    public void listBoatsByPatron(String patronId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.BOATS + "?patronId=" + patronId), callback);
    }

    public void createBoat(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.BOATS);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void updateBoat(String boatId, String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("PATCH", ApiEndpoints.BOATS + "/" + boatId);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void deleteBoat(String boatId, String actorId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("DELETE", ApiEndpoints.BOATS + "/" + boatId + "?actorId=" + actorId), callback);
    }
}
