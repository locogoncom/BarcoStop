package com.barcostop.app.ui.screens;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
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
import com.barcostop.app.core.actions.RatingActions;
import com.barcostop.app.core.actions.TripActions;
import com.barcostop.app.core.network.AssetUrlResolver;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.util.RemoteImageLoader;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

public class TripDetailActivity extends AppCompatActivity {
    private TripActions tripActions;
    private BookingActions bookingActions;
    private MessageActions messageActions;
    private FavoriteActions favoriteActions;
    private RatingActions ratingActions;
    private SessionStore sessionStore;

    private TextView titleView;
    private ImageView imageView;
    private TextView routeView;
    private TextView metaView;
    private TextView departureView;
    private TextView seatsView;
    private TextView priceView;
    private TextView contributionView;
    private TextView noteView;
    private TextView statusView;
    private TextView routeOriginView;
    private TextView routeDestinationView;
    private TextView captainNameView;
    private TextView captainRatingView;
    private TextView boatNameView;
    private TextView boatTypeView;
    private TextView boatModelView;
    private TextView reservationHintView;
    private TextView regattaHintView;
    private TextView reviewsEmptyView;
    private ProgressBar loading;
    private View captainCard;
    private View captainActionsRow;
    private View reviewsCard;
    private View checkpointsCard;
    private android.widget.LinearLayout reviewsContainer;
    private android.widget.LinearLayout checkpointsContainer;
    private TextView checkpointsEmptyView;
    private Button openMapsButton;
    private Button shareTripButton;
    private Button regattaChatButton;
    private Button addCheckpointButton;
    private Button reserveButton;
    private Button cancelButton;
    private Button chatButton;
    private Button viewProfileButton;
    private Button captainFavoriteButton;
    private Button editTripButton;
    private Button cancelTripButton;
    private Button deleteTripButton;
    private Button redditAutopublishButton;
    private Button favoriteToggleButton;

    private String tripId = "";
    private String patronId = "";
    private String patronName = "";
    private String currentOrigin = "";
    private String currentDestination = "";
    private String currentTitle = "";
    private String currentDepartureLabel = "";
    private String currentTripKind = "trip";
    private String regattaConversationId = "";
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
        ratingActions = new RatingActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        tripId = safe(getIntent().getStringExtra("tripId"));
        if (tripId.isEmpty()) {
            FeedbackFx.error(this, getString(R.string.trip_not_found));
            finish();
            return;
        }

        MaterialToolbar toolbar = findViewById(R.id.detail_toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(getString(R.string.screen_trip_detail));
            getSupportActionBar().setSubtitle(null);
        }

        titleView = findViewById(R.id.detail_title);
        imageView = findViewById(R.id.detail_image);
        routeView = findViewById(R.id.detail_route);
        metaView = findViewById(R.id.detail_meta);
        departureView = findViewById(R.id.detail_departure);
        seatsView = findViewById(R.id.detail_seats);
        priceView = findViewById(R.id.detail_price);
        contributionView = findViewById(R.id.detail_contribution);
        noteView = findViewById(R.id.detail_note);
        statusView = findViewById(R.id.detail_status);
        routeOriginView = findViewById(R.id.detail_route_origin);
        routeDestinationView = findViewById(R.id.detail_route_destination);
        captainCard = findViewById(R.id.detail_captain_card);
        captainActionsRow = findViewById(R.id.detail_captain_actions);
        reviewsCard = findViewById(R.id.detail_reviews_card);
        checkpointsCard = findViewById(R.id.detail_checkpoints_card);
        captainNameView = findViewById(R.id.detail_captain_name);
        captainRatingView = findViewById(R.id.detail_captain_rating);
        boatNameView = findViewById(R.id.detail_boat_name);
        boatTypeView = findViewById(R.id.detail_boat_type);
        boatModelView = findViewById(R.id.detail_boat_model);
        reservationHintView = findViewById(R.id.detail_reservation_hint);
        regattaHintView = findViewById(R.id.detail_regatta_hint);
        reviewsContainer = findViewById(R.id.detail_reviews_container);
        reviewsEmptyView = findViewById(R.id.detail_reviews_empty);
        checkpointsContainer = findViewById(R.id.detail_checkpoints_container);
        checkpointsEmptyView = findViewById(R.id.detail_checkpoints_empty);
        openMapsButton = findViewById(R.id.detail_open_maps);
        shareTripButton = findViewById(R.id.detail_share_trip);
        regattaChatButton = findViewById(R.id.detail_regatta_chat);
        addCheckpointButton = findViewById(R.id.detail_add_checkpoint);
        loading = findViewById(R.id.detail_loading);
        reserveButton = findViewById(R.id.detail_reserve);
        cancelButton = findViewById(R.id.detail_cancel_reservation);
        chatButton = findViewById(R.id.detail_captain_chat);
        viewProfileButton = findViewById(R.id.detail_captain_profile);
        captainFavoriteButton = findViewById(R.id.detail_captain_favorite);
        editTripButton = findViewById(R.id.detail_edit_trip);
        cancelTripButton = findViewById(R.id.detail_cancel_trip);
        deleteTripButton = findViewById(R.id.detail_delete_trip);
        redditAutopublishButton = findViewById(R.id.detail_reddit_autopublish);
        favoriteToggleButton = captainFavoriteButton;

        reserveButton.setOnClickListener(v -> createReservation());
        cancelButton.setOnClickListener(v -> cancelReservation());
        chatButton.setOnClickListener(v -> openChatWithCaptain());
        viewProfileButton.setOnClickListener(v -> openCaptainProfile());
        editTripButton.setOnClickListener(v -> openEditTrip());
        cancelTripButton.setOnClickListener(v -> cancelTrip());
        deleteTripButton.setOnClickListener(v -> deleteTrip());
        redditAutopublishButton.setOnClickListener(v -> autoPublishReddit());
        favoriteToggleButton.setOnClickListener(v -> toggleFavorite());
        openMapsButton.setOnClickListener(v -> openRouteInMaps());
        shareTripButton.setOnClickListener(v -> shareTrip());
        regattaChatButton.setOnClickListener(v -> openRegattaChat());
        addCheckpointButton.setOnClickListener(v -> openCheckpointMenu());
        setupBottomNav();

        loadAll();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            getOnBackPressedDispatcher().onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void setupBottomNav() {
        BottomNavigationView bottomNav = findViewById(R.id.detail_bottom_nav);
        Menu menu = bottomNav.getMenu();
        MenuItem secondaryItem = menu.findItem(R.id.nav_secondary);
        if (HomeActivity.ROLE_PATRON.equalsIgnoreCase(safe(sessionStore.getRole()))) {
            secondaryItem.setTitle(R.string.tab_requests);
        } else {
            secondaryItem.setTitle(R.string.tab_reservations);
        }

        bottomNav.setSelectedItemId(R.id.nav_trips);
        bottomNav.setOnItemSelectedListener(item -> {
            openMainTab(mapMenuIdToTab(item.getItemId()));
            return true;
        });
    }

    private void openMainTab(String tab) {
        Intent intent = new Intent(this, MainAppActivity.class);
        intent.putExtra(MainAppActivity.EXTRA_INITIAL_TAB, tab);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }

    private static String mapMenuIdToTab(int itemId) {
        if (itemId == R.id.nav_secondary) return MainAppActivity.TAB_SECONDARY;
        if (itemId == R.id.nav_messages) return MainAppActivity.TAB_MESSAGES;
        if (itemId == R.id.nav_favorites) return MainAppActivity.TAB_FAVORITES;
        if (itemId == R.id.nav_profile) return MainAppActivity.TAB_PROFILE;
        return MainAppActivity.TAB_TRIPS;
    }

    private void loadAll() {
        loading.setVisibility(View.VISIBLE);
        loadTrip();
        loadMyReservation();
        loadFavoriteState();
        loadCheckpoints();
    }

    private void loadTrip() {
        tripActions.getTrip(tripId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject trip = new JSONObject(body);
                    JSONObject route = trip.optJSONObject("route");

                    ParsedDescription parsed = parseDescription(trip);
                    String title = parsed.title;
                    if (title.isEmpty()) title = getString(R.string.trip_default_title);

                    String origin = route != null ? readFirst(route, "origin") : readFirst(trip, "origin");
                    String destination = route != null ? readFirst(route, "destination") : readFirst(trip, "destination");
                    String date = route != null ? readFirst(route, "departureDate") : readFirst(trip, "departureDate");
                    String departureTime = route != null ? readFirst(route, "departureTime") : readFirst(trip, "departureTime");
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
                    currentTitle = title;
                    currentOrigin = safe(origin);
                    currentDestination = safe(destination);
                    String departureLabel = formatDeparture(date, departureTime, parsed.timeWindow);
                    currentDepartureLabel = departureLabel;
                    currentTripKind = safe(tripKind).isEmpty() ? "trip" : safe(tripKind);
                    titleView.setText("regatta".equals(tripKind) ? "🏁 " + title : title);
                    RemoteImageLoader.load(imageView, AssetUrlResolver.resolve(parsed.boatImageUrl), R.drawable.bg_trip_image_placeholder);
                    routeView.setText(safe(origin).isEmpty() && safe(destination).isEmpty()
                            ? getString(R.string.label_from_to, "?", "?")
                            : getString(R.string.label_from_to, fallback(origin), fallback(destination)));
                    if ("regatta".equals(tripKind)) {
                        metaView.setText(getString(R.string.trip_meta_regatta_full, departureLabel, getString(R.string.trip_meta_regatta)));
                    } else if (price == 0 && !parsed.contributionType.isEmpty()) {
                        metaView.setText(getString(R.string.trip_meta_contribution, departureLabel, seats, parsed.contributionType));
                    } else {
                        metaView.setText(getString(R.string.label_trip_meta, departureLabel, seats, price));
                    }
                    departureView.setText(getString(R.string.trip_detail_departure_label) + ": " + departureLabel);
                    seatsView.setText(getString(R.string.trip_detail_seats_label) + ": " + seats);
                    if (price > 0) {
                        priceView.setText(getString(R.string.trip_detail_price_label) + ": " + String.format(Locale.ROOT, "%.2f €", price));
                    } else {
                        priceView.setText(getString(R.string.trip_detail_price_label) + ": " + getString(R.string.trip_card_price_free));
                    }
                    if (price == 0 && !parsed.contributionType.isEmpty()) {
                        contributionView.setVisibility(View.VISIBLE);
                        String extra = parsed.contributionNote.isEmpty() ? "" : " · " + parsed.contributionNote;
                        contributionView.setText(getString(R.string.trip_detail_contribution_label) + ": " + parsed.contributionType + extra);
                    } else {
                        contributionView.setVisibility(View.GONE);
                        contributionView.setText("");
                    }
                    if (!parsed.captainNote.isEmpty()) {
                        noteView.setVisibility(View.VISIBLE);
                        noteView.setText(getString(R.string.trip_detail_note_label) + ": " + parsed.captainNote);
                    } else if (price == 0 && !parsed.contributionNote.isEmpty()) {
                        noteView.setVisibility(View.VISIBLE);
                        noteView.setText(getString(R.string.trip_detail_note_label) + ": " + parsed.contributionNote);
                    } else {
                        noteView.setVisibility(View.GONE);
                        noteView.setText("");
                    }
                    statusView.setText(getString(R.string.trip_detail_status_label) + ": " + statusLabel(status));
                    applyStatusColor(statusColor(status));

                    routeOriginView.setText(fallback(origin));
                    routeDestinationView.setText(fallback(destination));

                    String boatName = patron != null ? readFirst(patron, "boatName", "boat_name") : "";
                    String boatType = patron != null ? readFirst(patron, "boatType", "boat_type") : "";
                    String boatModel = patron != null ? readFirst(patron, "boatModel", "boat_model") : "";
                    String avgRating = patron != null ? readFirst(patron, "averageRating", "average_rating") : "";
                    captainCard.setVisibility((patron != null || !patronName.isEmpty()) ? View.VISIBLE : View.GONE);
                    if (captainActionsRow != null) captainActionsRow.setVisibility(captainCard.getVisibility());
                    captainNameView.setText(getString(R.string.trip_detail_captain_label) + ": " + fallback(patronName));
                    captainRatingView.setText(getString(R.string.trip_detail_rating_label) + ": " + (avgRating.isEmpty() ? "0.0/5.0" : avgRating + "/5.0"));
                    boatNameView.setText(getString(R.string.trip_detail_boat_name_label) + ": " + fallback(boatName));
                    boatTypeView.setText(getString(R.string.trip_detail_boat_type_label) + ": " + fallback(boatType));
                    boatModelView.setText(getString(R.string.trip_detail_boat_model_label) + ": " + fallback(boatModel));
                    loadCaptainRatings();
                    loadRegattaSnapshot();
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
        boolean isRegatta = "regatta".equalsIgnoreCase(currentTripKind);

        boolean hasActiveReservation = !reservationId.isEmpty() && (
                reservationStatus.equalsIgnoreCase("pending") ||
                reservationStatus.equalsIgnoreCase("approved") ||
                reservationStatus.equalsIgnoreCase("confirmed")
        );

        reserveButton.setVisibility((hasSession && !isOwner && !hasActiveReservation) ? View.VISIBLE : View.GONE);
        cancelButton.setVisibility((hasSession && hasActiveReservation) ? View.VISIBLE : View.GONE);
        boolean allowChat = hasSession && !isOwner && (isRegatta || hasActiveReservation || reservationStatus.isEmpty());
        chatButton.setVisibility(allowChat ? View.VISIBLE : View.GONE);
        viewProfileButton.setVisibility((!patronId.isEmpty()) ? View.VISIBLE : View.GONE);
        favoriteToggleButton.setVisibility((hasSession && !isOwner && !patronId.isEmpty()) ? View.VISIBLE : View.GONE);
        favoriteToggleButton.setText(isFavorite
                ? getString(R.string.trip_detail_favorite_on)
                : getString(R.string.trip_detail_favorite_off));

        String reservationState = statusLabel(reservationStatus);
        if (hasSession && hasActiveReservation) {
            reservationHintView.setVisibility(View.VISIBLE);
            reservationHintView.setText(getString(R.string.trip_detail_status_label) + ": " + reservationState);
        } else {
            reservationHintView.setVisibility(View.GONE);
            reservationHintView.setText("");
        }

        editTripButton.setVisibility((hasSession && isOwner) ? View.VISIBLE : View.GONE);
        cancelTripButton.setVisibility((hasSession && isOwner) ? View.VISIBLE : View.GONE);
        deleteTripButton.setVisibility((hasSession && isOwner) ? View.VISIBLE : View.GONE);
        boolean redditConfigured = !safe(com.barcostop.app.BuildConfig.REDDIT_CLIENT_ID).isEmpty();
        redditAutopublishButton.setVisibility((hasSession && isOwner && redditConfigured) ? View.VISIBLE : View.GONE);
        regattaChatButton.setVisibility((hasSession && isRegatta) ? View.VISIBLE : View.GONE);
        if (addCheckpointButton != null) {
            addCheckpointButton.setVisibility((hasSession && isOwner) ? View.VISIBLE : View.GONE);
        }
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

    private void openRouteInMaps() {
        if (safe(currentOrigin).isEmpty() && safe(currentDestination).isEmpty()) return;
        try {
            String query = safe(currentOrigin) + (safe(currentDestination).isEmpty() ? "" : " to " + safe(currentDestination));
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=" + Uri.encode(query)));
            startActivity(intent);
        } catch (Throwable throwable) {
            FeedbackFx.error(this, getString(R.string.trip_detail_maps_error));
        }
    }

    private void shareTrip() {
        try {
            String title = fallback(currentTitle);
            String origin = fallback(currentOrigin);
            String destination = fallback(currentDestination);
            String when = safe(currentDepartureLabel).isEmpty() ? "" : ("\n" + currentDepartureLabel);
            String message = "BarcoStop · " + title + "\n" + origin + " → " + destination + when;
            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType("text/plain");
            share.putExtra(Intent.EXTRA_TEXT, message);
            startActivity(Intent.createChooser(share, getString(R.string.trip_detail_share_whatsapp)));
        } catch (Throwable throwable) {
            FeedbackFx.error(this, getString(R.string.trip_detail_share_error));
        }
    }

    private void loadRegattaSnapshot() {
        if (regattaHintView == null) return;
        if (!"regatta".equalsIgnoreCase(currentTripKind)) {
            regattaConversationId = "";
            regattaHintView.setVisibility(View.GONE);
            regattaHintView.setText("");
            return;
        }
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            loadRegattaReservationSnapshotOnly();
            return;
        }

        messageActions.getRegattaChat(tripId, userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject json = new JSONObject(body);
                    regattaConversationId = readFirst(json, "conversationId", "conversation_id");
                } catch (Throwable throwable) {
                    regattaConversationId = "";
                }
                loadRegattaReservationSnapshotOnly();
            }

            @Override
            public void onUiError(Throwable throwable) {
                regattaConversationId = "";
                loadRegattaReservationSnapshotOnly();
            }
        });
    }

    private void loadRegattaReservationSnapshotOnly() {
        bookingActions.listReservationsByTrip(tripId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                int pending = 0;
                int approved = 0;
                int cancelled = 0;
                int total = 0;
                try {
                    JSONArray arr = new JSONArray(body);
                    total = arr.length();
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject item = arr.optJSONObject(i);
                        if (item == null) continue;
                        String status = readFirst(item, "status").toLowerCase(Locale.ROOT);
                        if ("approved".equals(status) || "confirmed".equals(status)) approved += 1;
                        else if ("cancelled".equals(status) || "rejected".equals(status)) cancelled += 1;
                        else pending += 1;
                    }
                } catch (Throwable ignored) {
                }
                regattaHintView.setVisibility(View.VISIBLE);
                regattaHintView.setText(getString(R.string.trip_detail_regatta_snapshot, total, approved, pending, cancelled));
            }

            @Override
            public void onUiError(Throwable throwable) {
                regattaHintView.setVisibility(View.VISIBLE);
                regattaHintView.setText(getString(R.string.trip_detail_regatta_snapshot_error));
            }
        });
    }

    private void openRegattaChat() {
        if (!"regatta".equalsIgnoreCase(currentTripKind)) return;
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            FeedbackFx.info(this, getString(R.string.trip_login_required));
            return;
        }

        if (!regattaConversationId.isEmpty()) {
            openRegattaChatActivity(regattaConversationId);
            return;
        }

        messageActions.getRegattaChat(tripId, userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject json = new JSONObject(body);
                    regattaConversationId = readFirst(json, "conversationId", "conversation_id");
                } catch (Throwable throwable) {
                    regattaConversationId = "";
                }
                if (regattaConversationId.isEmpty()) {
                    FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_detail_regatta_chat_error));
                    return;
                }
                openRegattaChatActivity(regattaConversationId);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_detail_regatta_chat_error));
            }
        });
    }

    private void openRegattaChatActivity(String conversationId) {
        Intent intent = new Intent(this, ChatActivity.class);
        intent.putExtra("conversationId", conversationId);
        intent.putExtra("otherUserId", "");
        intent.putExtra("otherUserName", getString(R.string.trip_detail_regatta_chat_fallback));
        startActivity(intent);
    }

    private void loadCheckpoints() {
        if (checkpointsCard == null || checkpointsContainer == null || checkpointsEmptyView == null) return;
        tripActions.listTripCheckpoints(tripId, 12, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                JSONArray arr;
                try {
                    arr = new JSONArray(body);
                } catch (Throwable throwable) {
                    arr = new JSONArray();
                }
                renderCheckpoints(arr);
            }

            @Override
            public void onUiError(Throwable throwable) {
                renderCheckpoints(new JSONArray());
            }
        });
    }

    private void renderCheckpoints(JSONArray checkpoints) {
        if (checkpointsContainer == null || checkpointsEmptyView == null) return;
        checkpointsContainer.removeAllViews();
        int count = checkpoints == null ? 0 : checkpoints.length();
        checkpointsCard.setVisibility(View.VISIBLE);
        checkpointsEmptyView.setVisibility(count == 0 ? View.VISIBLE : View.GONE);

        int max = Math.min(count, 8);
        for (int i = 0; i < max; i++) {
            JSONObject row = checkpoints.optJSONObject(i);
            if (row == null) continue;
            String type = readFirst(row, "checkpointType", "checkpoint_type");
            String note = readFirst(row, "note");
            String created = readFirst(row, "createdAt", "created_at");

            TextView line = new TextView(this);
            line.setText("• " + checkpointLabel(type) + " · " + fallback(note) + " · " + fallback(created));
            line.setTextColor(getColor(R.color.bs_text));
            line.setTextSize(13f);
            line.setPadding(0, 4, 0, 6);
            checkpointsContainer.addView(line);
        }
    }

    private void openCheckpointMenu() {
        String actorId = safe(sessionStore.getUserId());
        if (actorId.isEmpty()) return;
        String[] labels = new String[]{
                getString(R.string.trip_detail_checkpoint_start),
                getString(R.string.trip_detail_checkpoint_mid),
                getString(R.string.trip_detail_checkpoint_arrival),
                getString(R.string.trip_detail_checkpoint_event)
        };
        String[] types = new String[]{"start", "mid", "arrival", "event"};
        String[] notes = new String[]{
                "Comenzamos el viaje",
                "Seguimos navegando",
                "Llegamos al destino",
                "Momento destacado"
        };

        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(R.string.trip_detail_checkpoints_add)
                .setItems(labels, (dialog, which) -> {
                    int index = Math.max(0, Math.min(which, types.length - 1));
                    createCheckpoint(types[index], notes[index]);
                })
                .setNegativeButton(R.string.common_cancel, null)
                .show();
    }

    private void createCheckpoint(String checkpointType, String note) {
        String actorId = safe(sessionStore.getUserId());
        if (actorId.isEmpty()) return;
        String payload = "{\"tripId\":\"" + tripId + "\",\"userId\":\"" + actorId + "\",\"checkpointType\":\"" + checkpointType + "\",\"note\":\"" + note + "\"}";
        tripActions.createTripCheckpoint(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(TripDetailActivity.this, getString(R.string.trip_detail_checkpoint_created));
                loadCheckpoints();
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(TripDetailActivity.this, getString(R.string.trip_detail_checkpoint_error));
            }
        });
    }

    private String checkpointLabel(String type) {
        String raw = safe(type).toLowerCase(Locale.ROOT);
        if ("start".equals(raw)) return getString(R.string.trip_detail_checkpoint_start);
        if ("mid".equals(raw)) return getString(R.string.trip_detail_checkpoint_mid);
        if ("arrival".equals(raw)) return getString(R.string.trip_detail_checkpoint_arrival);
        if ("event".equals(raw)) return getString(R.string.trip_detail_checkpoint_event);
        return fallback(type);
    }

    private void loadCaptainRatings() {
        if (patronId.isEmpty()) {
            if (reviewsCard != null) reviewsCard.setVisibility(View.GONE);
            return;
        }

        ratingActions.listRatingsByUser(patronId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject json = new JSONObject(body);
                    double avg = json.optDouble("averageRating", 0);
                    JSONArray ratings = json.optJSONArray("ratings");
                    if (captainRatingView != null) {
                        captainRatingView.setText(getString(R.string.trip_detail_rating_label) + ": " + String.format(Locale.ROOT, "%.1f/5.0", avg));
                    }
                    renderReviews(ratings);
                } catch (Throwable throwable) {
                    renderReviews(new JSONArray());
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                renderReviews(new JSONArray());
            }
        });
    }

    private void renderReviews(JSONArray ratings) {
        if (reviewsCard == null || reviewsContainer == null || reviewsEmptyView == null) return;
        reviewsContainer.removeAllViews();
        int count = ratings == null ? 0 : ratings.length();
        reviewsCard.setVisibility(View.VISIBLE);
        reviewsEmptyView.setVisibility(count == 0 ? View.VISIBLE : View.GONE);
        int max = Math.min(4, count);
        for (int i = 0; i < max; i++) {
            JSONObject row = ratings.optJSONObject(i);
            if (row == null) continue;
            String comment = readFirst(row, "comment");
            int stars = row.optInt("rating", 0);
            if (stars < 0) stars = 0;
            if (stars > 5) stars = 5;
            String starsText = stars == 0 ? "☆☆☆☆☆" : "★★★★★".substring(0, stars);
            TextView line = new TextView(this);
            line.setText(getString(R.string.trip_detail_review_item, starsText, (comment.isEmpty() ? "-" : comment)));
            line.setTextColor(getColor(R.color.bs_text));
            line.setTextSize(13f);
            line.setPadding(0, 4, 0, 6);
            reviewsContainer.addView(line);
        }
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

    private void applyStatusColor(int color) {
        try {
            if (statusView.getBackground() instanceof GradientDrawable) {
                GradientDrawable background = (GradientDrawable) statusView.getBackground().mutate();
                background.setColor(color);
                return;
            }
        } catch (Throwable ignored) {
        }
        statusView.setBackgroundColor(color);
    }

    private String statusLabel(String statusRaw) {
        String status = safe(statusRaw).toLowerCase(Locale.ROOT);
        if ("approved".equals(status)) return getString(R.string.status_approved);
        if ("confirmed".equals(status)) return getString(R.string.status_confirmed);
        if ("rejected".equals(status)) return getString(R.string.status_rejected);
        if ("cancelled".equals(status)) return getString(R.string.status_cancelled);
        if ("pending".equals(status)) return getString(R.string.status_pending);
        return getString(R.string.status_active);
    }

    private static String formatDeparture(String dateRaw, String timeRaw, String windowRaw) {
        String date = safe(dateRaw).replace("T", " ").trim();
        if (date.contains(" ")) {
            date = date.split(" ")[0];
        }
        String time = safe(timeRaw);
        String window = safe(windowRaw).toLowerCase(Locale.ROOT);
        String windowLabel = "";
        if ("morning".equals(window)) windowLabel = "manana";
        if ("afternoon".equals(window)) windowLabel = "tarde";
        if ("night".equals(window)) windowLabel = "noche";

        StringBuilder out = new StringBuilder();
        if (!date.isEmpty()) out.append(date);
        if (!time.isEmpty()) {
            if (out.length() > 0) out.append(" ");
            out.append(time);
        }
        if (!windowLabel.isEmpty()) {
            if (out.length() > 0) out.append(" · ");
            out.append(windowLabel);
        }
        if (out.length() == 0) return "-";
        return out.toString();
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
        String timeWindow = "";
    }

    private static ParsedDescription parseDescription(JSONObject trip) {
        ParsedDescription out = new ParsedDescription();
        String topLevelKind = trip.optString("tripKind", "").trim();
        if (!topLevelKind.isEmpty()) {
            out.tripKind = topLevelKind;
        }

        JSONObject metaObject = trip.optJSONObject("descriptionMeta");
        if (metaObject != null) {
            out.tripKind = metaObject.optString("tripKind", out.tripKind).trim();
            out.captainNote = metaObject.optString("captainNote", out.captainNote).trim();
            out.boatImageUrl = metaObject.optString("boatImageUrl", out.boatImageUrl).trim();
            out.contributionType = metaObject.optString("contributionType", out.contributionType).trim();
            out.contributionNote = metaObject.optString("contributionNote", out.contributionNote).trim();
            out.timeWindow = metaObject.optString("timeWindow", out.timeWindow).trim();
        }

        String rawDescription = readFirst(trip, "description", "title");
        String raw = rawDescription == null ? "" : rawDescription;
        int marker = raw.indexOf("[BSMETA]");
        if (marker < 0) {
            out.title = raw.trim();
            return out;
        }

        out.title = raw.substring(0, marker).trim();
        String metaRaw = raw.substring(marker + "[BSMETA]".length()).trim();
        try {
            JSONObject meta = new JSONObject(metaRaw);
            out.tripKind = meta.optString("tripKind", out.tripKind).trim();
            out.captainNote = meta.optString("captainNote", out.captainNote).trim();
            out.boatImageUrl = meta.optString("boatImageUrl", out.boatImageUrl).trim();
            out.contributionType = meta.optString("contributionType", out.contributionType).trim();
            out.contributionNote = meta.optString("contributionNote", out.contributionNote).trim();
            out.timeWindow = meta.optString("timeWindow", out.timeWindow).trim();
        } catch (Throwable ignored) {
        }
        return out;
    }

    private String fallback(String value) {
        String v = safe(value);
        return v.isEmpty() ? getString(R.string.trip_detail_value_undefined) : v;
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
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
