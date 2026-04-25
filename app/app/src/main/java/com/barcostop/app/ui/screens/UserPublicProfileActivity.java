package com.barcostop.app.ui.screens;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.RatingActions;
import com.barcostop.app.core.actions.UserActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.feedback.FeedbackFx;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class UserPublicProfileActivity extends AppCompatActivity {
    private UserActions userActions;
    private RatingActions ratingActions;
    private SessionStore sessionStore;
    private TextView nameView;
    private TextView roleView;
    private TextView ratingView;
    private TextView bioView;
    private TextView locationView;
    private TextView instagramView;
    private TextView languagesView;
    private TextView boatView;
    private EditText rateInput;
    private EditText rateCommentInput;
    private Button rateSendButton;
    private LinearLayout reviewsContainer;
    private TextView reviewsEmpty;
    private ProgressBar loading;

    private String userId = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_user_public_profile);
        setTitle(R.string.screen_user_public_profile);

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        userActions = new UserActions(app.getApiClient());
        ratingActions = new RatingActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        userId = safe(getIntent().getStringExtra("userId"));
        if (userId.isEmpty()) {
            finish();
            return;
        }

        nameView = findViewById(R.id.public_profile_name);
        roleView = findViewById(R.id.public_profile_role);
        ratingView = findViewById(R.id.public_profile_rating);
        bioView = findViewById(R.id.public_profile_bio);
        locationView = findViewById(R.id.public_profile_location);
        instagramView = findViewById(R.id.public_profile_instagram);
        languagesView = findViewById(R.id.public_profile_languages);
        boatView = findViewById(R.id.public_profile_boat);
        rateInput = findViewById(R.id.public_profile_rate_input);
        rateCommentInput = findViewById(R.id.public_profile_rate_comment);
        rateSendButton = findViewById(R.id.public_profile_rate_send);
        reviewsContainer = findViewById(R.id.public_profile_reviews_container);
        reviewsEmpty = findViewById(R.id.public_profile_reviews_empty);
        loading = findViewById(R.id.public_profile_loading);
        rateSendButton.setOnClickListener(v -> submitRating());

        loadProfile();
    }

    private void loadProfile() {
        loading.setVisibility(View.VISIBLE);
        userActions.getUserById(userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                loading.setVisibility(View.GONE);
                try {
                    JSONObject user = new JSONObject(body);
                    String name = readFirst(user, "name");
                    String role = readFirst(user, "role");
                    String bio = readFirst(user, "bio");
                    String currentLocation = readFirst(user, "currentLocation", "current_location");
                    String instagram = readFirst(user, "instagram");
                    String languages = readFirst(user, "languages");
                    String boatName = readFirst(user, "boatName", "boat_name");
                    String boatType = readFirst(user, "boatType", "boat_type");
                    double avgRating = user.optDouble("averageRating", 0);

                    nameView.setText(name.isEmpty() ? "User" : name);
                    roleView.setText(role.equalsIgnoreCase("patron") ? "Captain" : "Traveler");
                    ratingView.setText(getString(R.string.public_profile_rating_value, avgRating));
                    bioView.setText(bio.isEmpty() ? getString(R.string.public_profile_no_bio) : bio);
                    bindOptionalText(locationView, getString(R.string.public_profile_location_value, currentLocation), currentLocation);
                    bindOptionalText(instagramView, getString(R.string.public_profile_instagram_value, instagram), instagram);
                    bindOptionalText(languagesView, getString(R.string.public_profile_languages_value, languages), languages);
                    if (boatName.isEmpty() && boatType.isEmpty()) {
                        boatView.setVisibility(View.GONE);
                    } else {
                        boatView.setVisibility(View.VISIBLE);
                        boatView.setText(getString(R.string.public_profile_boat_value, boatName, boatType));
                    }
                    String viewerId = safe(sessionStore.getUserId());
                    boolean sameUser = !viewerId.isEmpty() && viewerId.equals(userId);
                    rateSendButton.setEnabled(!sameUser);
                    if (sameUser) {
                        rateInput.setEnabled(false);
                        rateCommentInput.setEnabled(false);
                    }

                    loadRatings();
                } catch (Throwable throwable) {
                    FeedbackFx.error(UserPublicProfileActivity.this, getString(R.string.public_profile_load_error));
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                FeedbackFx.error(UserPublicProfileActivity.this, getString(R.string.public_profile_load_error));
            }
        });
    }

    private void loadRatings() {
        ratingActions.listRatingsByUser(userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject json = new JSONObject(body);
                    double avgRating = json.optDouble("averageRating", 0);
                    ratingView.setText(getString(R.string.public_profile_rating_value, avgRating));
                    renderReviews(json.optJSONArray("ratings"));
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

    private void submitRating() {
        String viewerId = safe(sessionStore.getUserId());
        if (viewerId.isEmpty()) {
            FeedbackFx.error(this, getString(R.string.public_profile_rate_error));
            return;
        }
        if (viewerId.equals(userId)) {
            FeedbackFx.info(this, getString(R.string.public_profile_rate_self));
            return;
        }

        int stars = parseInt(safe(rateInput.getText() == null ? "" : rateInput.getText().toString()), 0);
        if (stars < 1 || stars > 5) {
            FeedbackFx.info(this, getString(R.string.public_profile_rate_invalid));
            return;
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("userId", userId);
            payload.put("ratedBy", viewerId);
            payload.put("rating", stars);
            payload.put("comment", safe(rateCommentInput.getText() == null ? "" : rateCommentInput.getText().toString()));

            rateSendButton.setEnabled(false);
            ratingActions.submitRating(payload.toString(), new UiApiCallback(this) {
                @Override
                public void onUiSuccess(String body) {
                    FeedbackFx.success(UserPublicProfileActivity.this, getString(R.string.public_profile_rate_ok));
                    rateInput.setText("");
                    rateCommentInput.setText("");
                    rateSendButton.setEnabled(true);
                    loadRatings();
                }

                @Override
                public void onUiError(Throwable throwable) {
                    rateSendButton.setEnabled(true);
                    FeedbackFx.error(UserPublicProfileActivity.this, extractApiError(throwable, getString(R.string.public_profile_rate_error)));
                }
            });
        } catch (Throwable throwable) {
            FeedbackFx.error(this, getString(R.string.public_profile_rate_error));
            rateSendButton.setEnabled(true);
        }
    }

    private void renderReviews(JSONArray ratings) {
        reviewsContainer.removeAllViews();
        int count = ratings == null ? 0 : ratings.length();
        reviewsEmpty.setVisibility(count == 0 ? View.VISIBLE : View.GONE);
        for (int i = 0; i < count; i++) {
            JSONObject row = ratings.optJSONObject(i);
            if (row == null) continue;
            TextView line = new TextView(this);
            String author = readFirst(row, "ratedByName", "ratedBy");
            String comment = readFirst(row, "comment");
            int stars = row.optInt("rating", 0);
            String createdAt = readFirst(row, "createdAt", "created_at");
            line.setText(getString(
                    R.string.public_profile_review_item,
                    nonEmpty(author, "user"),
                    stars,
                    formatDate(createdAt),
                    nonEmpty(comment, "-")
            ));
            line.setTextColor(getColor(R.color.bs_text));
            line.setPadding(0, 6, 0, 6);
            reviewsContainer.addView(line);
        }
    }

    private static void bindOptionalText(TextView view, String formattedText, String rawValue) {
        if (rawValue == null || rawValue.trim().isEmpty()) {
            view.setVisibility(View.GONE);
            return;
        }
        view.setVisibility(View.VISIBLE);
        view.setText(formattedText);
    }

    private static String readFirst(JSONObject obj, String... keys) {
        for (String key : keys) {
            String value = obj.optString(key, "").trim();
            if (!value.isEmpty()) return value;
        }
        return "";
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static String nonEmpty(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private static String formatDate(String raw) {
        String value = safe(raw);
        if (value.isEmpty()) return "-";
        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US);
            Date parsed = input.parse(value.replace('T', ' ').replace("Z", ""));
            if (parsed == null) return value;
            return new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(parsed);
        } catch (ParseException ignored) {
            return value;
        }
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private static String extractApiError(Throwable throwable, String fallback) {
        String msg = throwable == null ? "" : safe(throwable.getMessage());
        if (msg.isEmpty()) return fallback;
        int sep = msg.indexOf(" - ");
        if (sep < 0 || sep + 3 >= msg.length()) return fallback;
        String body = msg.substring(sep + 3).trim();

        try {
            JSONObject parsed = new JSONObject(body);
            String error = parsed.optString("error", "").trim();
            return error.isEmpty() ? fallback : error;
        } catch (Throwable ignored) {
            return fallback;
        }
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
