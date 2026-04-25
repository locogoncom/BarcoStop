package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class TripActions {
    private final ApiClient apiClient;

    public TripActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void listTrips(ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.TRIPS), callback);
    }

    public void getTrip(String tripId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.TRIPS + "/" + tripId), callback);
    }

    public void createTrip(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.TRIPS);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void updateTrip(String tripId, String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("PATCH", ApiEndpoints.TRIPS + "/" + tripId);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void deleteTrip(String tripId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("DELETE", ApiEndpoints.TRIPS + "/" + tripId), callback);
    }

    public void deleteTripWithActor(String tripId, String actorId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("DELETE", ApiEndpoints.TRIPS + "/" + tripId + "?actorId=" + actorId), callback);
    }

    public void autoPublishReddit(String tripId, String actorId, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.TRIPS + "/" + tripId + "/share/reddit");
        req.jsonBody = "{\"actorId\":\"" + actorId + "\"}";
        apiClient.execute(req, callback);
    }
}
