package com.barcostop.app.ui.screens;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.BookingActions;
import com.barcostop.app.core.actions.FavoriteActions;
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.actions.TripActions;
import com.barcostop.app.core.network.ApiConfig;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.util.RemoteImageLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

public class TripDetailActivity extends AppCompatActivity {
    private TripActions tripActions;
    private BookingActions bookingActions;
    private MessageActions messageActions;
    private FavoriteActions favoriteActions;
    private SessionStore sessionStore;

    private TextView titleView;
    private ImageView imageView;
    private TextView routeView;
    private TextView metaView;
    private TextView noteView;
    private TextView statusView;
    private ProgressBar loading;
    private Button reserveButton;
    private Button cancelButton;
    private Button chatButton;
    private Button viewProfileButton;
    private Button editTripButton;
    private Button cancelTripButton;
    private Button deleteTripButton;
    private Button redditAutopublishButton;
    private Button favoriteToggleButton;

    private String tripId = "";
    private String patronId = "";
    private String patronName = "";
    private String reservationId = "";
    private String reservationStatus = "";
    private boolean isFavorite = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_trip_detail);

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        tripActions = new TripActions(app.getApiClient());
        bookingActions = new BookingActions(app.getApiClient());
        messageActions = new MessageActions(app.getApiClient());
        favoriteActions = new FavoriteActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        tripId = safe(getIntent().getStringExtra("tripId"));
        if (tripId.isEmpty()) {
            FeedbackFx.error(this, getString(R.string.trip_not_found));
            finish();
            return;
        }

        titleView = findViewById(R.id.detail_title);
        imageView = findViewById(R.id.detail_image);
        routeView = findViewById(R.id.detail_route);
        metaView = findViewById(R.id.detail_meta);
        noteView = findViewById(R.id.detail_note);
        statusView = findViewById(R.id.detail_status);
        loading = findViewById(R.id.detail_loading);
        reserveButton = findViewById(R.id.detail_reserve);
        cancelButton = findViewById(R.id.detail_cancel_reservation);
        chatButton = findViewById(R.id.detail_chat);
        viewProfileButton = findViewById(R.id.detail_view_profile);
        editTripButton = findViewById(R.id.detail_edit_trip);
        cancelTripButton = findViewById(R.id.detail_cancel_trip);
        deleteTripButton = findViewById(R.id.detail_delete_trip);
        redditAutopublishButton = findViewById(R.id.detail_reddit_autopublish);
        favoriteToggleButton = findViewById(R.id.detail_favorite_toggle);

        reserveButton.setOnClickListener(v -> createReservation());
        cancelButton.setOnClickListener(v -> cancelReservation());
        chatButton.setOnClickListener(v -> openChatWithCaptain());
        viewProfileButton.setOnClickListener(v -> openCaptainProfile());
        editTripButton.setOnClickListener(v -> openEditTrip());
        cancelTripButton.setOnClickListener(v -> cancelTrip());
        deleteTripButton.setOnClickListener(v -> deleteTrip());
        redditAutopublishButton.setOnClickListener(v -> autoPublishReddit());
        favoriteToggleButton.setOnClickListener(v -> toggleFavorite());

        loadAll();
    }

    private void loadAll() {
        loading.setVisibility(View.VISIBLE);
        loadTrip();
        loadMyReservation();
        loadFavoriteState();
    }

    private void loadTrip() {
        tripActions.getTrip(tripId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject trip = new JSONObject(body);
                    JSONObject route = trip.optJSONObject("route");

                    String rawDescription = readFirst(trip, "description", "title");
                    ParsedDescription parsed = parseDescription(rawDescription);
                    String title = parsed.title;
                    if (title.isEmpty()) title = getString(R.string.trip_default_title);

                    String origin = route != null ? readFirst(route, "origin") : readFirst(trip, "origin");
                    String destination = route != null ? readFirst(route, "destination") : readFirst(trip, "destination");
                    String date = route != null ? readFirst(route, "departureDate") : readFirst(trip, "departureDate");
                    date = date.replace("T", " ").split(" ")[0];
                    int seats = trip.has("availableSeats") ? trip.optInt("availableSeats", 0) : trip.optInt("available_seats", 0);
                    double price = trip.has("cost") ? trip.optDouble("cost", 0) : trip.optDouble("price", 0);
                    String status = readFirst(trip, "status");

                    patronId = readFirst(trip, "patronId", "patron_id");
                    JSONObject patron = trip.optJSONObject("patron");
                    if (patron != null) {
                        patronId = patronId.isEmpty() ? readFirst(patron, "id") : patronId;
                        patronName = readFirst(patron, "name");
                    }

                    String tripKind = parsed.tripKind.isEmpty() ? "trip" : parsed.tripKind;
                    titleView.setText("regatta".equals(tripKind) ? "🏁 " + title : title);
                    RemoteImageLoader.load(imageView, resolveAssetUrl(parsed.boatImageUrl), R.drawable.bg_input);
                    routeView.setText(origin + " → " + destination);
                    if ("regatta".equals(tripKind)) {
                        metaView.setText(getString(R.string.trip_meta_regatta_full, date, getString(R.string.trip_meta_regatta)));
                    } else if (price == 0 && !parsed.contributionType.isEmpty()) {
                        metaView.setText(getString(R.string.trip_meta_contribution, date, seats, parsed.contributionType));
                    } else {
                        metaView.setText(getString(R.string.label_trip_meta, date, seats, price));
                    }
                    if (!parsed.captainNote.isEmpty()) {
                        noteView.setVisibility(View.VISIBLE);
                        noteView.setText(getString(R.string.trip_note_prefix, parsed.captainNote));
                    } else if (price == 0 && !parsed.contributionNote.isEmpty()) {
                        noteView.setVisibility(View.VISIBLE);
                        noteView.setText(getString(R.string.trip_contribution_prefix, parsed.contributionNote));
                    } else {
                        noteView.setVisibility(View.GONE);
                        noteView.setText("");
                    }
                    statusView.setText(status.isEmpty() ? getString(R.string.status_active) : status);
                    statusView.setBackgroundColor(statusColor(status));
                } catch (Throwable throwable) {
                    FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_load_invalid_payload));
                } finally {
                    loading.setVisibility(View.GONE);
                    refreshButtons();
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_load_error));
            }
        });
    }

    private void loadMyReservation() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            refreshButtons();
            return;
        }

        bookingActions.listReservationsByUser(userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                reservationId = "";
                reservationStatus = "";
                try {
                    JSONArray arr = new JSONArray(body);
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject item = arr.optJSONObject(i);
                        if (item == null) continue;
                        String rid = readFirst(item, "id");
                        String tid = readFirst(item, "tripId", "trip_id");
                        if (!tripId.equals(tid)) continue;

                        reservationId = rid;
                        reservationStatus = readFirst(item, "status");
                        break;
                    }
                } catch (Throwable ignored) {
                }
                refreshButtons();
            }

            @Override
            public void onUiError(Throwable throwable) {
                refreshButtons();
            }
        });
    }

    private void createReservation() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            FeedbackFx.info(this, getString(R.string.trip_login_required));
            return;
        }

        String payload = "{\"tripId\":\"" + tripId + "\",\"userId\":\"" + userId + "\",\"seats\":1}";
        bookingActions.createReservation(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(TripDetailActivity.this, getString(R.string.trip_reservation_sent));
                loadMyReservation();
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_reservation_error));
            }
        });
    }

    private void cancelReservation() {
        if (reservationId.isEmpty()) return;
        bookingActions.updateReservationStatus(reservationId, "cancelled", new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(TripDetailActivity.this, getString(R.string.trip_reservation_cancelled));
                loadMyReservation();
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_reservation_cancel_error));
            }
        });
    }

    private void openChatWithCaptain() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            FeedbackFx.info(this, getString(R.string.trip_login_required));
            return;
        }
        if (patronId.isEmpty() || userId.equals(patronId)) {
            FeedbackFx.info(this, getString(R.string.trip_chat_unavailable));
            return;
        }

        String payload = "{\"userId1\":\"" + userId + "\",\"userId2\":\"" + patronId + "\",\"tripId\":\"" + tripId + "\"}";
        messageActions.createOrGetConversation(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                String conversationId = "";
                try {
                    JSONObject data = new JSONObject(body);
                    conversationId = readFirst(data, "id", "conversationId", "conversation_id");
                } catch (Throwable ignored) {
                }
                if (conversationId.isEmpty()) {
                    FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_open_chat_error));
                    return;
                }

                Intent intent = new Intent(TripDetailActivity.this, ChatActivity.class);
                intent.putExtra("conversationId", conversationId);
                intent.putExtra("otherUserId", patronId);
                intent.putExtra("otherUserName", patronName.isEmpty() ? getString(R.string.trip_captain_fallback) : patronName);
                startActivity(intent);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_open_chat_error));
            }
        });
    }

    private void refreshButtons() {
        String userId = safe(sessionStore.getUserId());
        boolean hasSession = !userId.isEmpty();
        boolean isOwner = hasSession && !patronId.isEmpty() && userId.equals(patronId);

        boolean hasActiveReservation = !reservationId.isEmpty() && (
                reservationStatus.equalsIgnoreCase("pending") ||
                reservationStatus.equalsIgnoreCase("approved") ||
                reservationStatus.equalsIgnoreCase("confirmed")
        );

        reserveButton.setVisibility((hasSession && !isOwner && !hasActiveReservation) ? View.VISIBLE : View.GONE);
        cancelButton.setVisibility((hasSession && hasActiveReservation) ? View.VISIBLE : View.GONE);
        chatButton.setVisibility((hasSession && !isOwner) ? View.VISIBLE : View.GONE);
        viewProfileButton.setVisibility((!patronId.isEmpty()) ? View.VISIBLE : View.GONE);
        favoriteToggleButton.setVisibility((hasSession && !isOwner && !patronId.isEmpty()) ? View.VISIBLE : View.GONE);
        favoriteToggleButton.setText(isFavorite ? getString(R.string.trip_favorite_remove_cta) : getString(R.string.trip_favorite_add_cta));
        editTripButton.setVisibility((hasSession && isOwner) ? View.VISIBLE : View.GONE);
        cancelTripButton.setVisibility((hasSession && isOwner) ? View.VISIBLE : View.GONE);
        deleteTripButton.setVisibility((hasSession && isOwner) ? View.VISIBLE : View.GONE);
        redditAutopublishButton.setVisibility((hasSession && isOwner) ? View.VISIBLE : View.GONE);
    }

    private void loadFavoriteState() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) return;
        favoriteActions.listFavorites(userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                isFavorite = false;
                try {
                    JSONArray arr = new JSONArray(body);
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject item = arr.optJSONObject(i);
                        if (item == null) continue;
                        String favoriteId = readFirst(item, "favoriteUserId", "id");
                        if (!patronId.isEmpty() && patronId.equals(favoriteId)) {
                            isFavorite = true;
                            break;
                        }
                    }
                } catch (Throwable ignored) {
                }
                refreshButtons();
            }

            @Override
            public void onUiError(Throwable throwable) {
                refreshButtons();
            }
        });
    }

    private void toggleFavorite() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty() || patronId.isEmpty()) return;

        if (isFavorite) {
            favoriteActions.removeFavorite(userId, patronId, new UiApiCallback(this) {
                @Override
                public void onUiSuccess(String body) {
                    isFavorite = false;
                    refreshButtons();
                    FeedbackFx.success(TripDetailActivity.this, getString(R.string.trip_favorite_removed));
                }

                @Override
                public void onUiError(Throwable throwable) {
                    FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_favorite_remove_error));
                }
            });
            return;
        }

        String payload = "{\"userId\":\"" + userId + "\",\"favoriteUserId\":\"" + patronId + "\"}";
        favoriteActions.addFavorite(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                isFavorite = true;
                refreshButtons();
                FeedbackFx.success(TripDetailActivity.this, getString(R.string.trip_favorite_added));
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_favorite_add_error));
            }
        });
    }

    private void openEditTrip() {
        Intent intent = new Intent(this, EditTripActivity.class);
        intent.putExtra("tripId", tripId);
        startActivity(intent);
    }

    private void cancelTrip() {
        String actorId = safe(sessionStore.getUserId());
        if (actorId.isEmpty()) return;
        String payload = "{\"status\":\"cancelled\",\"actorId\":\"" + actorId + "\"}";
        tripActions.updateTrip(tripId, payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(TripDetailActivity.this, getString(R.string.trip_cancel_ok));
                loadTrip();
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_cancel_error));
            }
        });
    }

    private void deleteTrip() {
        String actorId = safe(sessionStore.getUserId());
        if (actorId.isEmpty()) return;
        tripActions.deleteTripWithActor(tripId, actorId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(TripDetailActivity.this, getString(R.string.trip_delete_ok));
                finish();
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_delete_error));
            }
        });
    }

    private void openCaptainProfile() {
        if (patronId.isEmpty()) return;
        Intent intent = new Intent(this, UserPublicProfileActivity.class);
        intent.putExtra("userId", patronId);
        startActivity(intent);
    }

    private void autoPublishReddit() {
        String actorId = safe(sessionStore.getUserId());
        if (actorId.isEmpty()) return;
        tripActions.autoPublishReddit(tripId, actorId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                String message = getString(R.string.trip_reddit_autopublish_ok);
                String draftUrl = "";
                boolean skipped = false;
                try {
                    JSONObject obj = new JSONObject(body);
                    skipped = obj.optBoolean("skipped", false) || "DISABLED".equalsIgnoreCase(readFirst(obj, "status"));
                    if (obj.has("enabled") && !obj.optBoolean("enabled", true)) {
                        skipped = true;
                    }
                    if (skipped) {
                        return;
                    }
                    String detail = readFirst(obj, "message", "status");
                    if (!detail.isEmpty()) {
                        message = detail;
                    }
                    draftUrl = readFirst(obj, "draftUrl");
                } catch (Throwable ignored) {
                }
                if (skipped) {
                    return;
                }
                FeedbackFx.success(TripDetailActivity.this, message);
                if (!draftUrl.isEmpty()) {
                    try {
                        Intent openDraftIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(draftUrl));
                        startActivity(openDraftIntent);
                    } catch (Throwable ignored) {
                    }
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                String message = getString(R.string.trip_reddit_autopublish_error);
                if (throwable != null && throwable.getMessage() != null && !throwable.getMessage().trim().isEmpty()) {
                    message = throwable.getMessage();
                }
                FeedbackFx.error(TripDetailActivity.this, message);
            }
        });
    }

    private static int statusColor(String statusRaw) {
        String status = statusRaw == null ? "" : statusRaw.toLowerCase().trim();
        if (status.equals("approved") || status.equals("confirmed") || status.equals("active")) return Color.parseColor("#16A34A");
        if (status.equals("rejected") || status.equals("cancelled")) return Color.parseColor("#DC2626");
        return Color.parseColor("#D97706");
    }

    private static String readFirst(JSONObject obj, String... keys) {
        for (String key : keys) {
            String value = obj.optString(key, "").trim();
            if (!value.isEmpty()) return value;
        }
        return "";
    }

    private static class ParsedDescription {
        String title = "";
        String tripKind = "trip";
        String captainNote = "";
        String boatImageUrl = "";
        String contributionType = "";
        String contributionNote = "";
    }

    private static ParsedDescription parseDescription(String rawDescription) {
        ParsedDescription out = new ParsedDescription();
        String raw = rawDescription == null ? "" : rawDescription;
        int marker = raw.indexOf("\n[BSMETA]");
        if (marker < 0) {
            out.title = raw.trim();
            return out;
        }

        out.title = raw.substring(0, marker).trim();
        String metaRaw = raw.substring(marker + "\n[BSMETA]".length()).trim();
        try {
            JSONObject meta = new JSONObject(metaRaw);
            out.tripKind = meta.optString("tripKind", "trip").trim();
            out.captainNote = meta.optString("captainNote", "").trim();
            out.boatImageUrl = meta.optString("boatImageUrl", "").trim();
            out.contributionType = meta.optString("contributionType", "").trim();
            out.contributionNote = meta.optString("contributionNote", "").trim();
        } catch (Throwable ignored) {
        }
        return out;
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static String resolveAssetUrl(String rawUrl) {
        String url = safe(rawUrl);
        if (url.isEmpty()) return "";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;

        String apiBase = safe(ApiConfig.API_BASE_URL);
        if (apiBase.isEmpty()) return url;

        String origin = apiBase;
        int apiMarker = origin.indexOf("/api/");
        if (apiMarker > 0) {
            origin = origin.substring(0, apiMarker);
        } else {
            origin = origin.replaceAll("/+$", "");
        }

        if (url.startsWith("/")) return origin + url;
        return origin + "/" + url;
    }

    private abstract static class UiApiCallback implements com.barcostop.app.core.network.ApiCallback {
        private final AppCompatActivity activity;

        UiApiCallback(AppCompatActivity activity) {
            this.activity = activity;
        }

        @Override
        public final void onSuccess(String body) {
            activity.runOnUiThread(() -> onUiSuccess(body));
        }

        @Override
        public final void onError(Throwable throwable) {
            activity.runOnUiThread(() -> onUiError(throwable));
        }

        public abstract void onUiSuccess(String body);

        public abstract void onUiError(Throwable throwable);
    }
}
