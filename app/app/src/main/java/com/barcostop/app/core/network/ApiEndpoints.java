package com.barcostop.app.core.network;

public final class ApiEndpoints {
    private ApiEndpoints() {}

    public static final String USERS = "users";
    public static final String USERS_LOGIN = "users/login";
    public static final String USERS_LOGIN_GOOGLE = "users/login/google";
    public static final String AUTH_GOOGLE_CONFIG = "auth/google/config";

    public static final String TRIPS = "trips";
    public static final String TRIPS_UPLOAD_IMAGE = "trips/upload-image";

    public static final String BOATS = "boats";

    public static final String RESERVATIONS = "reservations";

    public static final String MESSAGES_CONVERSATION = "messages/conversation";
    public static final String MESSAGES_SEND = "messages/send";
    public static final String MESSAGES_BLOCK = "messages/block";
    public static final String MESSAGES_REPORT = "messages/report";

    public static final String FAVORITES = "favorites";
    public static final String DONATIONS = "donations";
    public static final String RATINGS = "ratings";
    public static final String SUPPORT_MESSAGES = "support-messages";
    public static final String TRIP_CHECKPOINTS = "trip-checkpoints";
}
