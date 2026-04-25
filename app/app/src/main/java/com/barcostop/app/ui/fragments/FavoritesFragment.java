package com.barcostop.app.ui.fragments;

import android.content.Intent;
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
import com.barcostop.app.core.actions.FavoriteActions;
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.FavoriteAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.ChatActivity;
import com.barcostop.app.ui.screens.MainAppActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class FavoritesFragment extends Fragment {
    private FavoriteActions favoriteActions;
    private MessageActions messageActions;
    private SessionStore sessionStore;

    private FavoriteAdapter adapter;
    private SwipeRefreshLayout swipe;
    private ProgressBar loading;
    private TextView empty;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_favorites, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        BarcoStopApplication app = (BarcoStopApplication) requireActivity().getApplication();
        favoriteActions = new FavoriteActions(app.getApiClient());
        messageActions = new MessageActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        swipe = view.findViewById(R.id.fav_swipe);
        loading = view.findViewById(R.id.fav_loading);
        empty = view.findViewById(R.id.fav_empty);

        RecyclerView recycler = view.findViewById(R.id.fav_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new FavoriteAdapter(new FavoriteAdapter.Actions() {
            @Override
            public void onChat(FavoriteAdapter.Item item) {
                startChat(item);
            }

            @Override
            public void onRemove(FavoriteAdapter.Item item) {
                removeFavorite(item);
            }
        });
        recycler.setAdapter(adapter);

        swipe.setOnRefreshListener(() -> load(false));
        load(true);
    }

    private void load(boolean firstLoad) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) return;

        if (firstLoad) {
            loading.setVisibility(View.VISIBLE);
            empty.setVisibility(View.GONE);
        }

        favoriteActions.listFavorites(userId, new UiApiCallback((androidx.appcompat.app.AppCompatActivity) requireActivity()) {
            @Override
            public void onUiSuccess(String body) {
                loading.setVisibility(View.GONE);
                swipe.setRefreshing(false);

                List<FavoriteAdapter.Item> items = parse(body);
                adapter.submit(items);
                empty.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                swipe.setRefreshing(false);
                empty.setVisibility(View.VISIBLE);

                if (throwable != null && throwable.getMessage() != null && throwable.getMessage().startsWith("JWT_")) {
                    if (requireActivity() instanceof MainAppActivity) {
                        ((MainAppActivity) requireActivity()).forceLogoutToHome();
                        return;
                    }
                }

                FeedbackFx.error(requireActivity(), getString(R.string.favorites_load_error));
            }
        });
    }

    private List<FavoriteAdapter.Item> parse(String raw) {
        List<FavoriteAdapter.Item> out = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.optJSONObject(i);
                if (obj == null) continue;

                FavoriteAdapter.Item item = new FavoriteAdapter.Item();
                item.id = readFirst(obj, "favoriteUserId", "id");
                item.name = readFirst(obj, "name");
                if (item.name.isEmpty()) item.name = getString(R.string.user_fallback);
                String role = readFirst(obj, "role");
                item.role = role.equalsIgnoreCase("patron")
                        ? getString(R.string.role_captain)
                        : getString(R.string.role_traveler);

                if (!item.id.isEmpty()) {
                    out.add(item);
                }
            }
        } catch (Throwable ignored) {
        }
        return out;
    }

    private void removeFavorite(FavoriteAdapter.Item item) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty() || item.id.isEmpty()) return;

        favoriteActions.removeFavorite(userId, item.id, new UiApiCallback((androidx.appcompat.app.AppCompatActivity) requireActivity()) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(requireActivity(), getString(R.string.favorites_remove_ok));
                load(false);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.favorites_remove_error));
            }
        });
    }

    private void startChat(FavoriteAdapter.Item item) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty() || item.id.isEmpty()) return;

        String payload = "{\"userId1\":\"" + userId + "\",\"userId2\":\"" + item.id + "\",\"tripId\":null}";
        messageActions.createOrGetConversation(payload, new UiApiCallback((androidx.appcompat.app.AppCompatActivity) requireActivity()) {
            @Override
            public void onUiSuccess(String body) {
                String conversationId = "";
                try {
                    JSONObject data = new JSONObject(body);
                    conversationId = readFirst(data, "id", "conversationId", "conversation_id");
                } catch (Throwable ignored) {
                }
                if (conversationId.isEmpty()) {
                    FeedbackFx.error(requireActivity(), getString(R.string.favorites_open_chat_error));
                    return;
                }

                Intent intent = new Intent(requireContext(), ChatActivity.class);
                intent.putExtra("conversationId", conversationId);
                intent.putExtra("otherUserId", item.id);
                intent.putExtra("otherUserName", item.name);
                startActivity(intent);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.favorites_open_chat_error));
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
}
