package com.barcostop.app.ui.fragments;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
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
import com.barcostop.app.BuildConfig;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.BookingActions;
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.core.util.TripTextSanitizer;
import com.barcostop.app.ui.adapters.ReservationAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.ChatActivity;
import com.barcostop.app.ui.screens.MainAppActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ReservationsFragment extends Fragment {
    private BookingActions bookingActions;
    private MessageActions messageActions;
    private SessionStore sessionStore;

    private ReservationAdapter adapter;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar loading;
    private TextView empty;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_reservations, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        BarcoStopApplication app = (BarcoStopApplication) requireActivity().getApplication();
        bookingActions = new BookingActions(app.getApiClient());
        messageActions = new MessageActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        swipeRefresh = view.findViewById(R.id.res_swipe);
        loading = view.findViewById(R.id.res_loading);
        empty = view.findViewById(R.id.res_empty);

        RecyclerView recycler = view.findViewById(R.id.res_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new ReservationAdapter(new ReservationAdapter.ReservationActions() {
            @Override
            public void onPrimary(ReservationAdapter.Item item) {
                if ("pending".equalsIgnoreCase(item.status) || "approved".equalsIgnoreCase(item.status) || "confirmed".equalsIgnoreCase(item.status)) {
                    updateStatus(item.id, "cancelled", getString(R.string.reservations_cancelled_ok));
                }
            }

            @Override
            public void onSecondary(ReservationAdapter.Item item) {
                if ("approved".equalsIgnoreCase(item.status) || "confirmed".equalsIgnoreCase(item.status)) {
                    openChatWithCaptain(item);
                }
            }

            @Override
            public void onTertiary(ReservationAdapter.Item item) {
                if ("approved".equalsIgnoreCase(item.status) || "confirmed".equalsIgnoreCase(item.status)) {
                    openPayPalDonation();
                }
            }
        });
        recycler.setAdapter(adapter);

        updateToolbarTitle(0);
        swipeRefresh.setOnRefreshListener(() -> loadData(false));
        loadData(true);
    }

    private void loadData(boolean firstLoad) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) return;

        if (firstLoad) {
            loading.setVisibility(View.VISIBLE);
            empty.setVisibility(View.GONE);
        }

        bookingActions.listReservationsByUser(userId, new UiApiCallback(ReservationsFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                loading.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);

                List<ReservationAdapter.Item> items = parse(body);
                adapter.submit(items);
                empty.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
                updateToolbarTitle(items.size());
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                empty.setVisibility(View.VISIBLE);

                if (throwable != null && throwable.getMessage() != null && throwable.getMessage().startsWith("JWT_")) {
                    if (requireActivity() instanceof MainAppActivity) {
                        ((MainAppActivity) requireActivity()).forceLogoutToHome();
                        return;
                    }
                }

                FeedbackFx.error(requireActivity(), getString(R.string.reservations_load_error));
            }
        });
    }

    private List<ReservationAdapter.Item> parse(String raw) {
        List<ReservationAdapter.Item> out = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.optJSONObject(i);
                if (obj == null) continue;

                JSONObject trip = obj.optJSONObject("trip");
                ReservationAdapter.Item item = new ReservationAdapter.Item();
                item.id = readFirst(obj, "id");
                item.status = readFirst(obj, "status");
                item.tripId = readFirst(obj, "tripId", "trip_id");
                String title = trip != null ? readFirst(trip, "title") : "";
                if (title.isEmpty() && trip != null) {
                    title = readFirst(trip, "description");
                }
                title = TripTextSanitizer.stripBsMeta(title);
                item.tripTitle = getString(R.string.reservations_trip_fallback);

                String origin = trip != null ? readFirst(trip, "origin") : "";
                String destination = trip != null ? readFirst(trip, "destination") : "";
                String departureDate = trip != null ? readFirst(trip, "departureDate", "departure_date") : "";
                String departureTime = trip != null ? readFirst(trip, "departureTime", "departure_time") : "";
                String seats = trip != null ? readFirst(trip, "availableSeats", "available_seats") : "";
                String cost = trip != null ? readFirst(trip, "cost", "price") : "";
                String patronName = trip != null ? readFirst(trip, "patronName", "patron_name") : "";
                JSONObject patron = trip != null ? trip.optJSONObject("patron") : null;
                if (patron != null) {
                    item.patronId = readFirst(patron, "id");
                    if (patronName.isEmpty()) patronName = readFirst(patron, "name");
                }
                if (item.patronId.isEmpty() && trip != null) {
                    item.patronId = readFirst(trip, "patronId", "patron_id");
                }
                String routeLine = "📍 " + safe(origin) + "  →  " + safe(destination);
                String when = (departureDate + " " + departureTime).trim();
                if (when.isEmpty()) when = getString(R.string.trip_detail_value_undefined);
                String seatsLabel = seats.isEmpty() ? "?" : seats;
                String priceLabel = cost.isEmpty() || "0".equals(cost) || "0.0".equals(cost) || "0.00".equals(cost)
                        ? getString(R.string.trip_card_price_free)
                        : (cost + " EUR");
                String captainLine = patronName.isEmpty() ? "" : "\n👤 " + patronName;
                item.route = routeLine
                        + "\n🕒 " + when
                        + "\n👥 " + getString(R.string.trip_detail_seats_label) + ": " + seatsLabel
                        + "\n💵 " + getString(R.string.trip_detail_price_label) + ": " + priceLabel
                        + captainLine;

                boolean cancellable = item.status.equalsIgnoreCase("pending") || item.status.equalsIgnoreCase("approved") || item.status.equalsIgnoreCase("confirmed");
                boolean canChat = item.status.equalsIgnoreCase("approved") || item.status.equalsIgnoreCase("confirmed");
                item.showPrimary = cancellable;
                item.primaryText = getString(R.string.common_cancel);
                item.showSecondary = canChat;
                item.secondaryText = getString(R.string.reservations_open_chat_cta);
                boolean hasPayPal = hasPayPalConfigured();
                item.showTertiary = canChat && hasPayPal;
                item.tertiaryText = getString(R.string.reservations_paypal_cta);
                out.add(item);
            }
        } catch (Throwable ignored) {
        }
        return out;
    }

    private void updateStatus(String reservationId, String status, String successMessage) {
        bookingActions.updateReservationStatus(reservationId, status, new UiApiCallback(ReservationsFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(requireActivity(), successMessage);
                loadData(false);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.reservations_update_error));
            }
        });
    }

    private void updateToolbarTitle(int count) {
        if (!(requireActivity() instanceof AppCompatActivity)) return;
        AppCompatActivity activity = (AppCompatActivity) requireActivity();
        if (activity.getSupportActionBar() == null) return;
        activity.getSupportActionBar().setTitle(
                getString(R.string.tab_with_count, getString(R.string.tab_reservations), Math.max(0, count))
        );
    }

    private void openChatWithCaptain(ReservationAdapter.Item item) {
        String myUserId = safe(sessionStore.getUserId());
        String captainId = safe(item.patronId);
        if (myUserId.isEmpty() || captainId.isEmpty() || myUserId.equals(captainId)) {
            FeedbackFx.info(requireActivity(), getString(R.string.reservations_chat_unavailable));
            return;
        }

        String payload = "{\"userId1\":\"" + myUserId + "\",\"userId2\":\"" + captainId + "\",\"tripId\":\"" + safe(item.tripId) + "\"}";
        messageActions.createOrGetConversation(payload, new UiApiCallback(ReservationsFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                String conversationId = "";
                try {
                    JSONObject data = new JSONObject(body);
                    conversationId = readFirst(data, "id", "conversationId", "conversation_id");
                } catch (Throwable ignored) {
                }
                if (conversationId.isEmpty()) {
                    FeedbackFx.error(requireActivity(), getString(R.string.reservations_open_chat_error));
                    return;
                }

                android.content.Intent intent = new android.content.Intent(requireContext(), ChatActivity.class);
                intent.putExtra("conversationId", conversationId);
                intent.putExtra("otherUserId", captainId);
                intent.putExtra("otherUserName", getString(R.string.reservations_captain_fallback));
                startActivity(intent);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.reservations_open_chat_error));
            }
        });
    }

    private void openPayPalDonation() {
        String url = resolvePayPalDonationUrl();
        if (url.isEmpty()) {
            FeedbackFx.info(requireActivity(), getString(R.string.reservations_paypal_missing));
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Throwable throwable) {
            FeedbackFx.error(requireActivity(), getString(R.string.reservations_paypal_error));
        }
    }

    private static boolean hasPayPalConfigured() {
        return !safe(BuildConfig.PAYPAL_ME).isEmpty();
    }

    private static String resolvePayPalDonationUrl() {
        String raw = safe(BuildConfig.PAYPAL_ME);
        if (raw.isEmpty()) return "";
        if (raw.contains("?")) return raw;
        if (raw.endsWith("/")) raw = raw.substring(0, raw.length() - 1);
        return raw + "/2.5?locale.x=es_ES&country.x=ES";
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
