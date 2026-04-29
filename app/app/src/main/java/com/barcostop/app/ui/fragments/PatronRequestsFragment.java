package com.barcostop.app.ui.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
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
import com.barcostop.app.core.actions.BookingActions;
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.actions.TripActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.core.util.TripTextSanitizer;
import com.barcostop.app.ui.adapters.ReservationAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.ChatActivity;
import com.barcostop.app.ui.screens.MainAppActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class PatronRequestsFragment extends Fragment {
    private TripActions tripActions;
    private BookingActions bookingActions;
    private MessageActions messageActions;
    private SessionStore sessionStore;

    private ReservationAdapter adapter;
    private SwipeRefreshLayout swipe;
    private ProgressBar loading;
    private TextView empty;
    private TextView summary;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_reservations, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        BarcoStopApplication app = (BarcoStopApplication) requireActivity().getApplication();
        tripActions = new TripActions(app.getApiClient());
        bookingActions = new BookingActions(app.getApiClient());
        messageActions = new MessageActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        swipe = view.findViewById(R.id.res_swipe);
        loading = view.findViewById(R.id.res_loading);
        empty = view.findViewById(R.id.res_empty);
        summary = view.findViewById(R.id.res_summary);
        TextView title = view.findViewById(R.id.res_title);
        if (title != null) title.setText(R.string.tab_requests);
        empty.setText(R.string.patron_requests_empty);
        if (summary != null) summary.setText(getString(R.string.patron_requests_summary_count, 0));

        RecyclerView recycler = view.findViewById(R.id.res_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new ReservationAdapter(new ReservationAdapter.ReservationActions() {
            @Override
            public void onPrimary(ReservationAdapter.Item item) {
                if (item.status.equalsIgnoreCase("approved") || item.status.equalsIgnoreCase("confirmed")) {
                    openChat(item);
                    return;
                }
                update(item.id, "approved", getString(R.string.patron_requests_approved));
            }

            @Override
            public void onSecondary(ReservationAdapter.Item item) {
                update(item.id, "rejected", getString(R.string.patron_requests_rejected));
            }

            @Override
            public void onTertiary(ReservationAdapter.Item item) {
                // No tertiary action for captain requests.
            }
        });
        recycler.setAdapter(adapter);

        swipe.setOnRefreshListener(() -> load(true));
        load(false);
    }

    private void load(boolean refreshOnly) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) return;

        if (!refreshOnly) {
            loading.setVisibility(View.VISIBLE);
            empty.setVisibility(View.GONE);
        }

        tripActions.listTrips(new UiApiCallback(PatronRequestsFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                Set<String> ownTripIds = parseOwnTripIds(body, userId);
                if (ownTripIds.isEmpty()) {
                    finishWithItems(new ArrayList<>());
                    return;
                }

                List<ReservationAdapter.Item> collected = new ArrayList<>();
                loadTripReservationsSequential(new ArrayList<>(ownTripIds), 0, collected);
            }

            @Override
            public void onUiError(Throwable throwable) {
                onFailure(throwable);
            }
        });
    }

    private void loadTripReservationsSequential(List<String> tripIds, int index, List<ReservationAdapter.Item> collected) {
        if (index >= tripIds.size()) {
            finishWithItems(collected);
            return;
        }

        String tripId = tripIds.get(index);
        bookingActions.listReservationsByTrip(tripId, new UiApiCallback(PatronRequestsFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                collected.addAll(parseTripReservations(body));
                loadTripReservationsSequential(tripIds, index + 1, collected);
            }

            @Override
            public void onUiError(Throwable throwable) {
                loadTripReservationsSequential(tripIds, index + 1, collected);
            }
        });
    }

    private void finishWithItems(List<ReservationAdapter.Item> items) {
        loading.setVisibility(View.GONE);
        swipe.setRefreshing(false);
        adapter.submit(items);
        empty.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
        if (summary != null) {
            summary.setText(getString(R.string.patron_requests_summary_count, items.size()));
        }
    }

    private void onFailure(Throwable throwable) {
        loading.setVisibility(View.GONE);
        swipe.setRefreshing(false);
        empty.setVisibility(View.VISIBLE);

        if (throwable != null && throwable.getMessage() != null && throwable.getMessage().startsWith("JWT_")) {
            if (requireActivity() instanceof MainAppActivity) {
                ((MainAppActivity) requireActivity()).forceLogoutToHome();
                return;
            }
        }

        FeedbackFx.error(requireActivity(), getString(R.string.patron_requests_load_error));
    }

    private Set<String> parseOwnTripIds(String body, String userId) {
        Set<String> result = new HashSet<>();
        try {
            JSONArray arr = new JSONArray(body);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject trip = arr.optJSONObject(i);
                if (trip == null) continue;
                String patronId = readFirst(trip, "patronId", "patron_id");
                if (userId.equals(patronId)) {
                    String tripId = readFirst(trip, "id");
                    if (!tripId.isEmpty()) result.add(tripId);
                }
            }
        } catch (Throwable ignored) {
        }
        return result;
    }

    private List<ReservationAdapter.Item> parseTripReservations(String body) {
        List<ReservationAdapter.Item> out = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(body);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.optJSONObject(i);
                if (obj == null) continue;
                JSONObject trip = obj.optJSONObject("trip");

                ReservationAdapter.Item item = new ReservationAdapter.Item();
                item.id = readFirst(obj, "id");
                item.status = readFirst(obj, "status");
                item.tripId = readFirst(obj, "tripId", "trip_id");
                item.travelerId = readFirst(obj, "userId", "user_id");
                item.travelerName = readFirst(obj, "userName", "user_name");

                String title = trip != null ? readFirst(trip, "title", "description") : "";
                title = TripTextSanitizer.stripBsMeta(title);
                item.tripTitle = title.isEmpty() ? getString(R.string.patron_requests_trip_fallback) : title;
                String origin = trip != null ? readFirst(trip, "origin") : "";
                String destination = trip != null ? readFirst(trip, "destination") : "";
                String departureDate = trip != null ? readFirst(trip, "departureDate", "departure_date") : "";
                String seats = readFirst(obj, "seats");
                String travelerLabel = item.travelerName.isEmpty()
                        ? getString(R.string.patron_requests_traveler_fallback)
                        : item.travelerName;
                item.route = travelerLabel + " · " + origin + " → " + destination + " · " + departureDate + " · plazas " + (seats.isEmpty() ? "1" : seats);

                boolean pending = item.status.equalsIgnoreCase("pending");
                boolean approved = item.status.equalsIgnoreCase("approved") || item.status.equalsIgnoreCase("confirmed");
                item.showPrimary = pending || approved;
                item.showSecondary = pending;
                item.primaryText = approved
                        ? getString(R.string.patron_requests_open_chat_cta)
                        : getString(R.string.patron_requests_approve_cta);
                item.secondaryText = getString(R.string.patron_requests_reject_cta);
                out.add(item);
            }
        } catch (Throwable ignored) {
        }
        return out;
    }

    private void update(String reservationId, String status, String successText) {
        bookingActions.updateReservationStatus(reservationId, status, new UiApiCallback(PatronRequestsFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(requireActivity(), successText);
                load(true);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.patron_requests_update_error));
            }
        });
    }

    private void openChat(ReservationAdapter.Item item) {
        String myUserId = safe(sessionStore.getUserId());
        String otherUserId = safe(item.travelerId);
        if (myUserId.isEmpty() || otherUserId.isEmpty() || myUserId.equals(otherUserId)) {
            FeedbackFx.info(requireActivity(), getString(R.string.patron_requests_chat_unavailable));
            return;
        }

        String payload = "{\"userId1\":\"" + myUserId + "\",\"userId2\":\"" + otherUserId + "\",\"tripId\":\"" + safe(item.tripId) + "\"}";
        messageActions.createOrGetConversation(payload, new UiApiCallback(PatronRequestsFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                String conversationId = "";
                try {
                    JSONObject data = new JSONObject(body);
                    conversationId = readFirst(data, "id", "conversationId", "conversation_id");
                } catch (Throwable ignored) {
                }
                if (conversationId.isEmpty()) {
                    FeedbackFx.error(requireActivity(), getString(R.string.patron_requests_open_chat_error));
                    return;
                }

                android.content.Intent intent = new android.content.Intent(requireContext(), ChatActivity.class);
                intent.putExtra("conversationId", conversationId);
                intent.putExtra("otherUserId", otherUserId);
                intent.putExtra(
                        "otherUserName",
                        safe(item.travelerName).isEmpty()
                                ? getString(R.string.patron_requests_traveler_fallback)
                                : item.travelerName
                );
                startActivity(intent);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.patron_requests_open_chat_error));
            }
        });
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
}
