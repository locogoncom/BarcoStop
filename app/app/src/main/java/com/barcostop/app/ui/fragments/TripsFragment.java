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
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.TripActions;
import com.barcostop.app.core.util.TripTextSanitizer;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.TripListAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.CreateTripActivity;
import com.barcostop.app.ui.screens.EditTripActivity;
import com.barcostop.app.ui.screens.HomeActivity;
import com.barcostop.app.ui.screens.MainAppActivity;
import com.barcostop.app.ui.screens.TripDetailActivity;
import com.barcostop.app.ui.util.KeyboardUtils;

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
    private LinearLayout searchContainer;
    private View searchExtraContainer;
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
        searchContainer = view.findViewById(R.id.trips_search_container);
        searchExtraContainer = view.findViewById(R.id.trips_search_extra);
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
            setSearchExpanded(false);
            TextWatcher searchWatcher = new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                    if (searchOriginInput.hasFocus() || !safe(String.valueOf(searchOriginInput.getText())).isEmpty()) {
                        setSearchExpanded(true);
                    }
                    applyFilters();
                }

                @Override
                public void afterTextChanged(Editable s) {}
            };
            searchOriginInput.addTextChangedListener(searchWatcher);
            searchDestinationInput.addTextChangedListener(searchWatcher);
            searchDateInput.addTextChangedListener(searchWatcher);
            searchOriginInput.setOnEditorActionListener((v, actionId, event) -> {
                KeyboardUtils.hide(requireContext(), v);
                v.clearFocus();
                return false;
            });
            searchDestinationInput.setOnEditorActionListener((v, actionId, event) -> {
                KeyboardUtils.hide(requireContext(), v);
                v.clearFocus();
                return false;
            });
            searchDateInput.setOnEditorActionListener((v, actionId, event) -> {
                KeyboardUtils.hide(requireContext(), v);
                v.clearFocus();
                return false;
            });
            searchOriginInput.setOnClickListener(v -> setSearchExpanded(true));
            searchOriginInput.setOnFocusChangeListener((v, hasFocus) -> {
                if (hasFocus) setSearchExpanded(true);
            });

            todayButton.setOnClickListener(v -> {
                setSearchExpanded(true);
                searchDateInput.setText(todayIsoDate());
                applyFilters();
            });
            tomorrowButton.setOnClickListener(v -> {
                setSearchExpanded(true);
                searchDateInput.setText(tomorrowIsoDate());
                applyFilters();
            });
            clearSearchButton.setOnClickListener(v -> {
                KeyboardUtils.hide(requireContext(), v);
                searchOriginInput.setText("");
                searchDestinationInput.setText("");
                searchDateInput.setText("");
                searchOriginInput.clearFocus();
                searchDestinationInput.clearFocus();
                searchDateInput.clearFocus();
                setSearchExpanded(false);
                applyFilters();
            });
        }

        updateToolbarTitle(0);
        swipeRefresh.setOnRefreshListener(() -> loadTrips(false));
        loadTrips(true);
    }

    private void loadTrips(boolean firstLoad) {
        if (firstLoad) {
            loadingView.setVisibility(View.VISIBLE);
            emptyView.setVisibility(View.GONE);
        }

        tripActions.listTrips(new UiApiCallback(TripsFragment.this) {
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
        updateToolbarTitle(filtered.size());
    }

    private void setSearchExpanded(boolean expanded) {
        if (searchExtraContainer == null) return;
        searchExtraContainer.setVisibility(expanded ? View.VISIBLE : View.GONE);
    }

    private void updateToolbarTitle(int count) {
        if (!(requireActivity() instanceof AppCompatActivity)) return;
        AppCompatActivity activity = (AppCompatActivity) requireActivity();
        if (activity.getSupportActionBar() == null) return;
        activity.getSupportActionBar().setTitle(
                getString(R.string.tab_with_count, getString(R.string.tab_trips), Math.max(0, count))
        );
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
                mapped.title = TripTextSanitizer.stripBsMeta(rawDescription);
                if (mapped.title.isEmpty()) {
                    mapped.title = TripTextSanitizer.stripBsMeta(item.optString("title", ""));
                }
                if (mapped.title == null || mapped.title.trim().isEmpty()) {
                    mapped.title = mapped.origin + " → " + mapped.destination;
                } else {
                    int marker = rawDescription.indexOf("[BSMETA]");
                    if (marker >= 0) {
                        try {
                            String metaRaw = rawDescription.substring(marker + "[BSMETA]".length()).trim();
                            JSONObject meta = new JSONObject(metaRaw);
                            mapped.tripKind = meta.optString("tripKind", "trip");
                            mapped.captainNote = meta.optString("captainNote", "");
                            mapped.contributionType = meta.optString("contributionType", "");
                            mapped.contributionNote = meta.optString("contributionNote", "");
                            mapped.boatImageUrl = meta.optString("boatImageUrl", "");
                            mapped.timeWindow = meta.optString("timeWindow", "");
                        } catch (Throwable ignored) {
                        }
                    }
                }
                JSONObject metaObj = item.optJSONObject("descriptionMeta");
                if (metaObj != null) {
                    mapped.tripKind = metaObj.optString("tripKind", mapped.tripKind);
                    mapped.captainNote = metaObj.optString("captainNote", mapped.captainNote);
                    mapped.contributionType = metaObj.optString("contributionType", mapped.contributionType);
                    mapped.contributionNote = metaObj.optString("contributionNote", mapped.contributionNote);
                    mapped.boatImageUrl = metaObj.optString("boatImageUrl", mapped.boatImageUrl);
                    mapped.timeWindow = metaObj.optString("timeWindow", mapped.timeWindow);
                }
                String topLevelTripKind = item.optString("tripKind", "").trim();
                if (!topLevelTripKind.isEmpty()) {
                    mapped.tripKind = topLevelTripKind;
                }
                String departureDate = route != null ? route.optString("departureDate", "") : item.optString("departureDate", "");
                mapped.departureDate = departureDate.replace("T", " ").split(" ")[0];
                mapped.availableSeats = item.optInt("availableSeats", item.optInt("available_seats", 0));
                mapped.price = item.has("cost") ? item.optDouble("cost", 0) : item.optDouble("price", 0);
                mapped.patronId = item.optString("patronId", item.optString("patron_id", ""));
                JSONObject patron = item.optJSONObject("patron");
                if (patron != null) {
                    mapped.patronName = patron.optString("name", "").trim();
                    mapped.patronBoatName = patron.optString("boatName", patron.optString("boat_name", "")).trim();
                } else {
                    mapped.patronName = item.optString("patronName", item.optString("captainName", "")).trim();
                    mapped.patronBoatName = item.optString("boatName", item.optString("boat_name", "")).trim();
                }

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

        tripActions.deleteTripWithActor(item.id, userId, new UiApiCallback(TripsFragment.this) {
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
        private final androidx.fragment.app.Fragment fragment;

        UiApiCallback(androidx.fragment.app.Fragment fragment) {
            this.fragment = fragment;
        }

        @Override
        public final void onSuccess(String body) {
            android.app.Activity activity = fragment.getActivity();
            if (activity == null || !fragment.isAdded() || activity.isFinishing() || activity.isDestroyed()) {
                return;
            }
            activity.runOnUiThread(() -> {
                if (!fragment.isAdded()) return;
                onUiSuccess(body);
            });
        }

        @Override
        public final void onError(Throwable throwable) {
            android.app.Activity activity = fragment.getActivity();
            if (activity == null || !fragment.isAdded() || activity.isFinishing() || activity.isDestroyed()) {
                return;
            }
            activity.runOnUiThread(() -> {
                if (!fragment.isAdded()) return;
                onUiError(throwable);
            });
        }

        public abstract void onUiSuccess(String body);

        public abstract void onUiError(Throwable throwable);
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
