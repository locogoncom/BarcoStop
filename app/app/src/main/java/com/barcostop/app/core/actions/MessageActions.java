package com.barcostop.app.core.actions;

import com.barcostop.app.core.network.ApiCallback;
import com.barcostop.app.core.network.ApiClient;
import com.barcostop.app.core.network.ApiEndpoints;
import com.barcostop.app.core.network.ApiRequest;

public class MessageActions {
    private final ApiClient apiClient;

    public MessageActions(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public void getConversations(String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", "messages/conversations/" + userId), callback);
    }

    public void getConversationMessages(String conversationId, String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", "messages/conversation/" + conversationId + "/messages?userId=" + userId), callback);
    }

    public void sendMessage(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.MESSAGES_SEND);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void createOrGetConversation(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.MESSAGES_CONVERSATION);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void getBlockStatus(String userId, String otherUserId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", ApiEndpoints.MESSAGES_BLOCK + "/status?userId=" + userId + "&otherUserId=" + otherUserId), callback);
    }

    public void blockUser(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.MESSAGES_BLOCK);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void unblockUser(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("DELETE", ApiEndpoints.MESSAGES_BLOCK);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void reportUser(String jsonBody, ApiCallback callback) {
        ApiRequest req = new ApiRequest("POST", ApiEndpoints.MESSAGES_REPORT);
        req.jsonBody = jsonBody;
        apiClient.execute(req, callback);
    }

    public void getRegattaChat(String tripId, String userId, ApiCallback callback) {
        apiClient.execute(new ApiRequest("GET", "messages/regatta/" + tripId + "/chat?userId=" + userId), callback);
    }
}
