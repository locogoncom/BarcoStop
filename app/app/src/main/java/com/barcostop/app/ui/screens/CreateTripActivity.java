package com.barcostop.app.ui.screens;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.RadioGroup;

import androidx.appcompat.app.AppCompatActivity;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.TripActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.util.KeyboardUtils;
import com.google.android.material.appbar.MaterialToolbar;

import org.json.JSONObject;

public class CreateTripActivity extends AppCompatActivity {
    private static final String TRIP_KIND_TRIP = "trip";
    private static final String TRIP_KIND_REGATTA = "regatta";

    private TripActions tripActions;
    private SessionStore sessionStore;

    private RadioGroup tripKindGroup;
    private RadioGroup timeWindowGroup;
    private EditText titleInput;
    private EditText noteInput;
    private EditText boatImageUrlInput;
    private EditText originInput;
    private EditText destinationInput;
    private EditText dateInput;
    private EditText seatsInput;
    private EditText priceInput;
    private EditText contributionTypeInput;
    private EditText contributionNoteInput;
    private ProgressBar loading;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_create_trip);
        MaterialToolbar toolbar = findViewById(R.id.create_toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.screen_create_trip);
        }

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        tripActions = new TripActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        tripKindGroup = findViewById(R.id.create_trip_kind);
        timeWindowGroup = findViewById(R.id.create_time_window);
        titleInput = findViewById(R.id.create_title);
        noteInput = findViewById(R.id.create_note);
        boatImageUrlInput = findViewById(R.id.create_boat_image_url);
        originInput = findViewById(R.id.create_origin);
        destinationInput = findViewById(R.id.create_destination);
        dateInput = findViewById(R.id.create_date);
        seatsInput = findViewById(R.id.create_seats);
        priceInput = findViewById(R.id.create_price);
        contributionTypeInput = findViewById(R.id.create_contribution_type);
        contributionNoteInput = findViewById(R.id.create_contribution_note);
        loading = findViewById(R.id.create_loading);
        Button submit = findViewById(R.id.create_submit);

        submit.setOnClickListener(v -> submit());
        tripKindGroup.setOnCheckedChangeListener((group, checkedId) -> refreshConditionalFields());
        priceInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                refreshConditionalFields();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
        refreshConditionalFields();
    }

    private void submit() {
        KeyboardUtils.hide(this, getCurrentFocus());
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            FeedbackFx.info(this, getString(R.string.trip_login_required));
            return;
        }

        String title = safe(text(titleInput));
        String captainNote = safe(text(noteInput));
        String boatImageUrl = safe(text(boatImageUrlInput));
        String origin = safe(text(originInput));
        String destination = safe(text(destinationInput));
        String date = safe(text(dateInput));
        String tripKind = selectedTripKind();
        String timeWindow = selectedTimeWindow();
        int seats = parseInt(text(seatsInput), 1);
        double price = parseDouble(text(priceInput), 0);
        String contributionType = safe(text(contributionTypeInput));
        String contributionNote = safe(text(contributionNoteInput));

        boolean isRegatta = TRIP_KIND_REGATTA.equals(tripKind);
        if (isRegatta) {
            seats = 0;
            price = 0;
            contributionType = "";
            contributionNote = "";
        }

        if (title.isEmpty() || origin.isEmpty() || destination.isEmpty() || date.isEmpty()) {
            FeedbackFx.info(this, getString(R.string.trip_form_required_fields));
            return;
        }
        if (!date.matches("\\d{4}-\\d{2}-\\d{2}")) {
            FeedbackFx.info(this, getString(R.string.trip_form_date_format));
            return;
        }
        if (!isRegatta && seats < 1) {
            FeedbackFx.info(this, getString(R.string.trip_form_seats_min));
            return;
        }
        if (!isRegatta && price < 0) {
            FeedbackFx.info(this, getString(R.string.trip_form_price_min));
            return;
        }
        if (!isRegatta && price == 0 && contributionType.isEmpty()) {
            FeedbackFx.info(this, getString(R.string.trip_form_contribution_required));
            return;
        }

        loading.setVisibility(View.VISIBLE);
        try {
            JSONObject route = new JSONObject();
            route.put("origin", origin);
            route.put("destination", destination);
            route.put("departureDate", date);
            route.put("departureTime", windowToTime(timeWindow));
            route.put("estimatedDuration", "");

            JSONObject meta = new JSONObject();
            meta.put("tripKind", tripKind);
            meta.put("timeWindow", timeWindow);
            meta.put("captainNote", captainNote);
            if (!boatImageUrl.isEmpty()) meta.put("boatImageUrl", boatImageUrl);
            if (!contributionType.isEmpty()) meta.put("contributionType", contributionType);
            if (!contributionNote.isEmpty()) meta.put("contributionNote", contributionNote);
            String description = title + "\n[BSMETA]" + meta.toString();

            JSONObject payload = new JSONObject();
            payload.put("actorId", userId);
            payload.put("patronId", userId);
            payload.put("route", route);
            payload.put("description", description);
            payload.put("availableSeats", seats);
            payload.put("cost", price);

            tripActions.createTrip(payload.toString(), new UiApiCallback(this) {
                @Override
                public void onUiSuccess(String body) {
                    loading.setVisibility(View.GONE);
                    FeedbackFx.success(CreateTripActivity.this, getString(R.string.trip_create_ok));
                    finish();
                }

                @Override
                public void onUiError(Throwable throwable) {
                    loading.setVisibility(View.GONE);
                    FeedbackFx.error(CreateTripActivity.this, getString(R.string.trip_create_error));
                }
            });
        } catch (Throwable throwable) {
            loading.setVisibility(View.GONE);
            FeedbackFx.error(this, getString(R.string.trip_payload_invalid));
        }
    }

    private void refreshConditionalFields() {
        boolean isRegatta = TRIP_KIND_REGATTA.equals(selectedTripKind());
        double price = parseDouble(text(priceInput), 0);
        boolean showContribution = !isRegatta && price == 0;

        seatsInput.setVisibility(isRegatta ? View.GONE : View.VISIBLE);
        priceInput.setVisibility(isRegatta ? View.GONE : View.VISIBLE);
        contributionTypeInput.setVisibility(showContribution ? View.VISIBLE : View.GONE);
        contributionNoteInput.setVisibility(showContribution ? View.VISIBLE : View.GONE);
    }

    private String selectedTripKind() {
        return tripKindGroup.getCheckedRadioButtonId() == R.id.create_kind_regatta
                ? TRIP_KIND_REGATTA
                : TRIP_KIND_TRIP;
    }

    private String selectedTimeWindow() {
        int selected = timeWindowGroup.getCheckedRadioButtonId();
        if (selected == R.id.create_time_afternoon) return "afternoon";
        if (selected == R.id.create_time_night) return "night";
        return "morning";
    }

    private static String windowToTime(String window) {
        if ("afternoon".equals(window)) return "15:00:00";
        if ("night".equals(window)) return "20:00:00";
        return "09:00:00";
    }

    private static String text(EditText editText) {
        return editText.getText() == null ? "" : editText.getText().toString().trim();
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private static double parseDouble(String value, double fallback) {
        try {
            return Double.parseDouble(value);
        } catch (Throwable ignored) {
            return fallback;
        }
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

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
