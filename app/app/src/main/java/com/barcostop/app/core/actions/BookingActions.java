package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class BookingActions {
    private final ApiClient apiClient;

    public BookingActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void createReservation(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.RESERVATIONS);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void listReservationsByUser(String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.RESERVATIONS + "?userId=" + userId), callback);
    }

    public void listReservationsByTrip(String tripId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.RESERVATIONS + "?tripId=" + tripId), callback);
    }

    public void updateReservationStatus(String reservationId, String status, ApiCallback callback) {
        ApiRequest req = new ApiRequest("PATCH", ApiEndpoints.RESERVATIONS + "/" + reservationId);
        req.jsonBody = "{\"status\":\"" + status + "\"}";
        apiClient.execute(req, callback);
    }
}
