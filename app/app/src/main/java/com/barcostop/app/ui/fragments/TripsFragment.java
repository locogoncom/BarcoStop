package com.barcostop.app.ui.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.TripActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.TripListAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.CreateTripActivity;
import com.barcostop.app.ui.screens.EditTripActivity;
import com.barcostop.app.ui.screens.HomeActivity;
import com.barcostop.app.ui.screens.MainAppActivity;
import com.barcostop.app.ui.screens.TripDetailActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public class TripsFragment extends Fragment {
    private TripActions tripActions;
    private TripListAdapter adapter;
    private SessionStore sessionStore;
    private final List<TripListAdapter.TripItem> allTrips = new ArrayList<>();

    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar loadingView;
    private TextView emptyView;
    private TextView summaryView;
    private LinearLayout searchContainer;
    private EditText searchOriginInput;
    private EditText searchDestinationInput;
    private EditText searchDateInput;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_trip_list, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        BarcoStopApplication app = (BarcoStopApplication) requireActivity().getApplication();
        tripActions = new TripActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        swipeRefresh = view.findViewById(R.id.swipe_refresh);
        loadingView = view.findViewById(R.id.loading_view);
        emptyView = view.findViewById(R.id.empty_view);
        summaryView = view.findViewById(R.id.trips_summary);
        searchContainer = view.findViewById(R.id.trips_search_container);
        searchOriginInput = view.findViewById(R.id.trips_search_origin);
        searchDestinationInput = view.findViewById(R.id.trips_search_destination);
        searchDateInput = view.findViewById(R.id.trips_search_date);
        Button todayButton = view.findViewById(R.id.trips_btn_today);
        Button tomorrowButton = view.findViewById(R.id.trips_btn_tomorrow);
        Button clearSearchButton = view.findViewById(R.id.trips_btn_clear_search);

        RecyclerView recyclerView = view.findViewById(R.id.trips_recycler);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));

        adapter = new TripListAdapter(item -> {
            Intent intent = new Intent(requireContext(), TripDetailActivity.class);
            intent.putExtra("tripId", item.id);
            intent.putExtra("title", item.title);
            intent.putExtra("seats", String.valueOf(item.availableSeats));
            intent.putExtra("price", String.valueOf(item.price));
            startActivity(intent);
        }, item -> {
            String userId = safe(sessionStore.getUserId());
            if (!userId.equals(safe(item.patronId))) return;

            new androidx.appcompat.app.AlertDialog.Builder(requireContext())
                    .setTitle(R.string.trips_options_title)
                    .setItems(new CharSequence[]{getString(R.string.trips_options_edit), getString(R.string.trips_options_delete)}, (dialog, which) -> {
                        if (which == 0) {
                            Intent editIntent = new Intent(requireContext(), EditTripActivity.class);
                            editIntent.putExtra("tripId", item.id);
                            editIntent.putExtra("title", item.title);
                            editIntent.putExtra("seats", String.valueOf(item.availableSeats));
                            editIntent.putExtra("price", String.valueOf(item.price));
                            startActivity(editIntent);
                            return;
                        }

                        new androidx.appcompat.app.AlertDialog.Builder(requireContext())
                                .setTitle(R.string.trips_delete_title)
                                .setMessage(R.string.trips_delete_confirm)
                                .setNegativeButton(R.string.common_cancel, null)
                                .setPositiveButton(R.string.common_delete, (d, w) -> deleteTrip(item))
                                .show();
                    })
                    .show();
        });
        recyclerView.setAdapter(adapter);

        android.widget.Button createButton = view.findViewById(R.id.trips_create_button);
        boolean isPatron = HomeActivity.ROLE_PATRON.equals(safe(sessionStore.getRole()));
        createButton.setVisibility(isPatron ? View.VISIBLE : View.GONE);
        createButton.setOnClickListener(v -> startActivity(new Intent(requireContext(), CreateTripActivity.class)));

        boolean isTraveler = HomeActivity.ROLE_VIAJERO.equals(safe(sessionStore.getRole()));
        searchContainer.setVisibility(isTraveler ? View.VISIBLE : View.GONE);
        if (isTraveler) {
            TextWatcher searchWatcher = new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                    applyFilters();
                }

                @Override
                public void afterTextChanged(Editable s) {}
            };
            searchOriginInput.addTextChangedListener(searchWatcher);
            searchDestinationInput.addTextChangedListener(searchWatcher);
            searchDateInput.addTextChangedListener(searchWatcher);

            todayButton.setOnClickListener(v -> {
                searchDateInput.setText(todayIsoDate());
                applyFilters();
            });
            tomorrowButton.setOnClickListener(v -> {
                searchDateInput.setText(tomorrowIsoDate());
                applyFilters();
            });
            clearSearchButton.setOnClickListener(v -> {
                searchOriginInput.setText("");
                searchDestinationInput.setText("");
                searchDateInput.setText("");
                applyFilters();
            });
        }

        swipeRefresh.setOnRefreshListener(() -> loadTrips(false));
        loadTrips(true);
    }

    private void loadTrips(boolean firstLoad) {
        if (firstLoad) {
            loadingView.setVisibility(View.VISIBLE);
            emptyView.setVisibility(View.GONE);
        }

        tripActions.listTrips(new UiApiCallback((androidx.appcompat.app.AppCompatActivity) requireActivity()) {
            @Override
            public void onUiSuccess(String body) {
                if (!isAdded()) {
                    return;
                }
                loadingView.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);

                List<TripListAdapter.TripItem> items = parseTrips(body);
                allTrips.clear();
                allTrips.addAll(items);
                applyFilters();
            }

            @Override
            public void onUiError(Throwable throwable) {
                if (!isAdded()) {
                    return;
                }
                loadingView.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                emptyView.setVisibility(View.VISIBLE);

                if (throwable != null && throwable.getMessage() != null && throwable.getMessage().startsWith("JWT_")) {
                    if (getActivity() instanceof MainAppActivity) {
                        ((MainAppActivity) getActivity()).forceLogoutToHome();
                        return;
                    }
                }

                if (getActivity() != null) {
                    FeedbackFx.error(getActivity(), getString(R.string.error_loading_trips));
                }
            }
        });
    }

    private void applyFilters() {
        if (!isAdded()) {
            return;
        }
        String searchOrigin = safe(searchOriginInput == null ? "" : String.valueOf(searchOriginInput.getText()));
        String searchDestination = safe(searchDestinationInput == null ? "" : String.valueOf(searchDestinationInput.getText()));
        String searchDate = safe(searchDateInput == null ? "" : String.valueOf(searchDateInput.getText()));

        String originLower = searchOrigin.toLowerCase(Locale.ROOT);
        String destinationLower = searchDestination.toLowerCase(Locale.ROOT);

        List<TripListAdapter.TripItem> filtered = new ArrayList<>();
        for (TripListAdapter.TripItem item : allTrips) {
            boolean byOrigin = originLower.isEmpty() || safe(item.origin).toLowerCase(Locale.ROOT).contains(originLower);
            boolean byDestination = destinationLower.isEmpty() || safe(item.destination).toLowerCase(Locale.ROOT).contains(destinationLower);
            boolean byDate = searchDate.isEmpty() || safe(item.departureDate).contains(searchDate);
            if (byOrigin && byDestination && byDate) {
                filtered.add(item);
            }
        }

        adapter.submit(filtered);
        emptyView.setVisibility(filtered.isEmpty() ? View.VISIBLE : View.GONE);
        if (summaryView != null) {
            summaryView.setText(getString(R.string.trips_summary_count, filtered.size()));
        }
    }

    private static String todayIsoDate() {
        Calendar now = Calendar.getInstance();
        return String.format(Locale.ROOT, "%04d-%02d-%02d",
                now.get(Calendar.YEAR),
                now.get(Calendar.MONTH) + 1,
                now.get(Calendar.DAY_OF_MONTH));
    }

    private static String tomorrowIsoDate() {
        Calendar now = Calendar.getInstance();
        now.add(Calendar.DAY_OF_MONTH, 1);
        return String.format(Locale.ROOT, "%04d-%02d-%02d",
                now.get(Calendar.YEAR),
                now.get(Calendar.MONTH) + 1,
                now.get(Calendar.DAY_OF_MONTH));
    }

    private List<TripListAdapter.TripItem> parseTrips(String rawBody) {
        List<TripListAdapter.TripItem> list = new ArrayList<>();
        try {
            JSONArray array = new JSONArray(rawBody);
            for (int i = 0; i < array.length(); i++) {
                JSONObject item = array.optJSONObject(i);
                if (item == null) continue;

                JSONObject route = item.optJSONObject("route");
                TripListAdapter.TripItem mapped = new TripListAdapter.TripItem();
                mapped.id = item.optString("id", "");
                mapped.origin = route != null ? route.optString("origin", "") : item.optString("origin", "");
                mapped.destination = route != null ? route.optString("destination", "") : item.optString("destination", "");
                String rawDescription = item.optString("description", "");
                mapped.title = rawDescription;
                if (mapped.title == null || mapped.title.trim().isEmpty()) {
                    mapped.title = mapped.origin + " → " + mapped.destination;
                } else {
                    int marker = mapped.title.indexOf("\n[BSMETA]");
                    if (marker >= 0) {
                        mapped.title = mapped.title.substring(0, marker).trim();
                        try {
                            String metaRaw = rawDescription.substring(marker + "\n[BSMETA]".length()).trim();
                            JSONObject meta = new JSONObject(metaRaw);
                            mapped.tripKind = meta.optString("tripKind", "trip");
                            mapped.captainNote = meta.optString("captainNote", "");
                            mapped.contributionType = meta.optString("contributionType", "");
                            mapped.boatImageUrl = meta.optString("boatImageUrl", "");
                        } catch (Throwable ignored) {
                        }
                    }
                }
                String departureDate = route != null ? route.optString("departureDate", "") : item.optString("departureDate", "");
                mapped.departureDate = departureDate.replace("T", " ").split(" ")[0];
                mapped.availableSeats = item.optInt("availableSeats", item.optInt("available_seats", 0));
                mapped.price = item.has("cost") ? item.optDouble("cost", 0) : item.optDouble("price", 0);
                mapped.patronId = item.optString("patronId", item.optString("patron_id", ""));

                list.add(mapped);
            }
        } catch (Throwable ignored) {
        }
        return list;
    }

    private void deleteTrip(TripListAdapter.TripItem item) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty() || item == null || safe(item.id).isEmpty()) {
            return;
        }

        tripActions.deleteTripWithActor(item.id, userId, new UiApiCallback((androidx.appcompat.app.AppCompatActivity) requireActivity()) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(requireActivity(), getString(R.string.trips_deleted_ok));
                loadTrips(false);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.trips_delete_error));
            }
        });
    }

    private abstract static class UiApiCallback implements com.barcostop.app.core.network.ApiCallback {
        private final androidx.appcompat.app.AppCompatActivity activity;

        UiApiCallback(androidx.appcompat.app.AppCompatActivity activity) {
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

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
