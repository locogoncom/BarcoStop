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

public class EditTripActivity extends AppCompatActivity {
    private static final String TRIP_KIND_TRIP = "trip";
    private static final String TRIP_KIND_REGATTA = "regatta";

    private TripActions tripActions;
    private SessionStore sessionStore;

    private String tripId = "";
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
        setContentView(R.layout.activity_edit_trip);
        MaterialToolbar toolbar = findViewById(R.id.edit_toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.trip_btn_edit);
        }

        tripId = getIntent().getStringExtra("tripId");
        if (tripId == null || tripId.trim().isEmpty()) {
            FeedbackFx.error(this, getString(R.string.trip_not_found));
            finish();
            return;
        }

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        tripActions = new TripActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        tripKindGroup = findViewById(R.id.edit_trip_kind);
        timeWindowGroup = findViewById(R.id.edit_time_window);
        titleInput = findViewById(R.id.edit_title);
        noteInput = findViewById(R.id.edit_note);
        boatImageUrlInput = findViewById(R.id.edit_boat_image_url);
        originInput = findViewById(R.id.edit_origin);
        destinationInput = findViewById(R.id.edit_destination);
        dateInput = findViewById(R.id.edit_date);
        seatsInput = findViewById(R.id.edit_seats);
        priceInput = findViewById(R.id.edit_price);
        contributionTypeInput = findViewById(R.id.edit_contribution_type);
        contributionNoteInput = findViewById(R.id.edit_contribution_note);
        loading = findViewById(R.id.edit_loading);
        Button submit = findViewById(R.id.edit_submit);

        submit.setOnClickListener(v -> save());
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
        loadTrip();
    }

    private void loadTrip() {
        loading.setVisibility(View.VISIBLE);
        tripActions.getTrip(tripId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                loading.setVisibility(View.GONE);
                try {
                    JSONObject trip = new JSONObject(body);
                    JSONObject route = trip.optJSONObject("route");

                    ParsedDescription parsed = parseDescription(trip);

                    titleInput.setText(parsed.title);
                    noteInput.setText(parsed.captainNote);
                    originInput.setText(route != null ? readFirst(route, "origin") : readFirst(trip, "origin"));
                    destinationInput.setText(route != null ? readFirst(route, "destination") : readFirst(trip, "destination"));

                    String departureDate = route != null ? readFirst(route, "departureDate") : readFirst(trip, "departureDate");
                    String departureTime = route != null ? readFirst(route, "departureTime") : readFirst(trip, "departureTime");
                    if (departureDate.contains("T")) departureDate = departureDate.split("T")[0];
                    if (departureDate.contains(" ")) departureDate = departureDate.split(" ")[0];
                    dateInput.setText(departureDate);

                    seatsInput.setText(String.valueOf(trip.optInt("availableSeats", trip.optInt("available_seats", 0))));
                    double cost = trip.has("cost") ? trip.optDouble("cost", 0) : trip.optDouble("price", 0);
                    priceInput.setText(String.valueOf(cost));
                    contributionTypeInput.setText(parsed.contributionType);
                    contributionNoteInput.setText(parsed.contributionNote);
                    boatImageUrlInput.setText(parsed.boatImageUrl);

                    if (TRIP_KIND_REGATTA.equals(parsed.tripKind)) {
                        tripKindGroup.check(R.id.edit_kind_regatta);
                    } else {
                        tripKindGroup.check(R.id.edit_kind_trip);
                    }

                    if ("afternoon".equals(parsed.timeWindow)) {
                        timeWindowGroup.check(R.id.edit_time_afternoon);
                    } else if ("night".equals(parsed.timeWindow)) {
                        timeWindowGroup.check(R.id.edit_time_night);
                    } else {
                        String inferred = inferTimeWindow(departureTime);
                        if ("afternoon".equals(inferred)) {
                            timeWindowGroup.check(R.id.edit_time_afternoon);
                        } else if ("night".equals(inferred)) {
                            timeWindowGroup.check(R.id.edit_time_night);
                        } else {
                            timeWindowGroup.check(R.id.edit_time_morning);
                        }
                    }

                    refreshConditionalFields();
                } catch (Throwable t) {
                    FeedbackFx.error(EditTripActivity.this, getString(R.string.trip_parse_error));
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                FeedbackFx.error(EditTripActivity.this, getString(R.string.trip_load_error));
            }
        });
    }

    private void save() {
        KeyboardUtils.hide(this, getCurrentFocus());
        String actorId = sessionStore.getUserId();
        if (actorId == null || actorId.trim().isEmpty()) {
            FeedbackFx.info(this, getString(R.string.trip_login_required));
            return;
        }

        String title = text(titleInput);
        String note = text(noteInput);
        String boatImageUrl = text(boatImageUrlInput);
        String origin = text(originInput);
        String destination = text(destinationInput);
        String date = text(dateInput);
        String tripKind = selectedTripKind();
        String timeWindow = selectedTimeWindow();
        int seats = parseInt(text(seatsInput), 1);
        double price = parseDouble(text(priceInput), 0);
        String contributionType = text(contributionTypeInput);
        String contributionNote = text(contributionNoteInput);

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
        if (!isRegatta && price == 0 && contributionType.trim().isEmpty()) {
            FeedbackFx.info(this, getString(R.string.trip_form_contribution_required));
            return;
        }

        loading.setVisibility(View.VISIBLE);
        try {
            JSONObject meta = new JSONObject();
            meta.put("tripKind", tripKind);
            meta.put("timeWindow", timeWindow);
            meta.put("captainNote", note);
            if (!boatImageUrl.isEmpty()) meta.put("boatImageUrl", boatImageUrl);
            if (!contributionType.isEmpty()) meta.put("contributionType", contributionType);
            if (!contributionNote.isEmpty()) meta.put("contributionNote", contributionNote);

            JSONObject route = new JSONObject();
            route.put("origin", origin);
            route.put("destination", destination);
            route.put("departureDate", date);
            route.put("departureTime", windowToTime(timeWindow));
            route.put("estimatedDuration", "");

            JSONObject payload = new JSONObject();
            payload.put("actorId", actorId.trim());
            payload.put("route", route);
            payload.put("description", title + "\n[BSMETA]" + meta.toString());
            payload.put("availableSeats", seats);
            payload.put("cost", price);

            tripActions.updateTrip(tripId, payload.toString(), new UiApiCallback(this) {
                @Override
                public void onUiSuccess(String body) {
                    loading.setVisibility(View.GONE);
                    FeedbackFx.success(EditTripActivity.this, getString(R.string.trip_update_ok));
                    setResult(RESULT_OK);
                    finish();
                }

                @Override
                public void onUiError(Throwable throwable) {
                    loading.setVisibility(View.GONE);
                    FeedbackFx.error(EditTripActivity.this, getString(R.string.trip_update_error));
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
        return tripKindGroup.getCheckedRadioButtonId() == R.id.edit_kind_regatta
                ? TRIP_KIND_REGATTA
                : TRIP_KIND_TRIP;
    }

    private String selectedTimeWindow() {
        int selected = timeWindowGroup.getCheckedRadioButtonId();
        if (selected == R.id.edit_time_afternoon) return "afternoon";
        if (selected == R.id.edit_time_night) return "night";
        return "morning";
    }

    private static String windowToTime(String window) {
        if ("afternoon".equals(window)) return "15:00:00";
        if ("night".equals(window)) return "20:00:00";
        return "09:00:00";
    }

    private static String inferTimeWindow(String departureTime) {
        if (departureTime == null || departureTime.length() < 2) return "morning";
        try {
            int hour = Integer.parseInt(departureTime.substring(0, 2));
            if (hour < 12) return "morning";
            if (hour < 19) return "afternoon";
            return "night";
        } catch (Throwable ignored) {
            return "morning";
        }
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
        String tripKind = TRIP_KIND_TRIP;
        String captainNote = "";
        String boatImageUrl = "";
        String timeWindow = "morning";
        String contributionType = "";
        String contributionNote = "";
    }

    private static ParsedDescription parseDescription(JSONObject trip) {
        ParsedDescription out = new ParsedDescription();
        String topLevelKind = trip.optString("tripKind", "").trim();
        if (TRIP_KIND_REGATTA.equals(topLevelKind)) {
            out.tripKind = TRIP_KIND_REGATTA;
        }

        JSONObject metaObject = trip.optJSONObject("descriptionMeta");
        if (metaObject != null) {
            String tripKind = metaObject.optString("tripKind", out.tripKind).trim();
            out.tripKind = TRIP_KIND_REGATTA.equals(tripKind) ? TRIP_KIND_REGATTA : TRIP_KIND_TRIP;
            out.captainNote = metaObject.optString("captainNote", out.captainNote).trim();
            out.boatImageUrl = metaObject.optString("boatImageUrl", out.boatImageUrl).trim();
            out.contributionType = metaObject.optString("contributionType", out.contributionType).trim();
            out.contributionNote = metaObject.optString("contributionNote", out.contributionNote).trim();
            String timeWindow = metaObject.optString("timeWindow", out.timeWindow).trim();
            if ("afternoon".equals(timeWindow) || "night".equals(timeWindow) || "morning".equals(timeWindow)) {
                out.timeWindow = timeWindow;
            }
        }

        String rawDescription = readFirst(trip, "description");
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
            String tripKind = meta.optString("tripKind", TRIP_KIND_TRIP).trim();
            out.tripKind = TRIP_KIND_REGATTA.equals(tripKind) ? TRIP_KIND_REGATTA : TRIP_KIND_TRIP;

            String timeWindow = meta.optString("timeWindow", "morning").trim();
            if ("afternoon".equals(timeWindow) || "night".equals(timeWindow) || "morning".equals(timeWindow)) {
                out.timeWindow = timeWindow;
            }

            out.captainNote = meta.optString("captainNote", "").trim();
            out.boatImageUrl = meta.optString("boatImageUrl", "").trim();
            out.contributionType = meta.optString("contributionType", "").trim();
            out.contributionNote = meta.optString("contributionNote", "").trim();
        } catch (Throwable ignored) {
        }
        return out;
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
