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
import com.barcostop.app.core.actions.UserActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.FavoriteAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.ChatActivity;
import com.barcostop.app.ui.screens.MainAppActivity;
import com.barcostop.app.ui.screens.UserPublicProfileActivity;
import com.barcostop.app.ui.util.KeyboardUtils;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class FavoritesFragment extends Fragment {
    private FavoriteActions favoriteActions;
    private MessageActions messageActions;
    private UserActions userActions;
    private SessionStore sessionStore;

    private FavoriteAdapter adapter;
    private SwipeRefreshLayout swipe;
    private ProgressBar loading;
    private TextView empty;
    private EditText searchInput;
    private Button topToggleButton;

    private final List<FavoriteAdapter.Item> favoriteItems = new ArrayList<>();
    private final List<UserItem> allUsers = new ArrayList<>();
    private final Set<String> favoriteIds = new HashSet<>();
    private String query = "";
    private boolean showTop = false;

    private static class UserItem {
        String id = "";
        String name = "";
        String role = "";
        double averageRating = 0;
        int reviewCount = 0;
    }

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
        userActions = new UserActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        swipe = view.findViewById(R.id.fav_swipe);
        loading = view.findViewById(R.id.fav_loading);
        empty = view.findViewById(R.id.fav_empty);
        searchInput = view.findViewById(R.id.fav_search);
        topToggleButton = view.findViewById(R.id.fav_toggle_top);

        RecyclerView recycler = view.findViewById(R.id.fav_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new FavoriteAdapter(new FavoriteAdapter.Actions() {
            @Override
            public void onPrimary(FavoriteAdapter.Item item) {
                if (favoriteIds.contains(item.id)) {
                    startChat(item.id, item.name);
                    return;
                }
                addFavorite(item);
            }

            @Override
            public void onSecondary(FavoriteAdapter.Item item) {
                if (favoriteIds.contains(item.id)) {
                    removeFavorite(item);
                    return;
                }
                startChat(item.id, item.name);
            }

            @Override
            public void onProfile(FavoriteAdapter.Item item) {
                if (item.id.isEmpty()) return;
                Intent intent = new Intent(requireContext(), UserPublicProfileActivity.class);
                intent.putExtra("userId", item.id);
                startActivity(intent);
            }
        });
        recycler.setAdapter(adapter);

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                query = s == null ? "" : s.toString().trim();
                renderList();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
        searchInput.setOnEditorActionListener((v, actionId, event) -> {
            KeyboardUtils.hide(requireContext(), v);
            v.clearFocus();
            return false;
        });

        topToggleButton.setOnClickListener(v -> {
            showTop = !showTop;
            topToggleButton.setText(showTop
                    ? getString(R.string.favorites_top_toggle_hide)
                    : getString(R.string.favorites_top_toggle_show));
            renderList();
        });

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

        favoriteActions.listFavorites(userId, new UiApiCallback(FavoritesFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                List<FavoriteAdapter.Item> items = parseFavorites(body);
                favoriteItems.clear();
                favoriteItems.addAll(items);
                favoriteIds.clear();
                for (FavoriteAdapter.Item item : items) {
                    if (!item.id.isEmpty()) favoriteIds.add(item.id);
                }
                loadUsersAndRender();
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

    private void loadUsersAndRender() {
        userActions.getUsers(new UiApiCallback(FavoritesFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                allUsers.clear();
                allUsers.addAll(parseUsers(body));
                loading.setVisibility(View.GONE);
                swipe.setRefreshing(false);
                renderList();
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                swipe.setRefreshing(false);
                renderList();
            }
        });
    }

    private List<FavoriteAdapter.Item> parseFavorites(String raw) {
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
                    item.primaryText = getString(R.string.common_chat);
                    item.showPrimary = true;
                    item.secondaryText = getString(R.string.common_remove);
                    item.showSecondary = true;
                    out.add(item);
                }
            }
        } catch (Throwable ignored) {
        }
        return out;
    }

    private List<UserItem> parseUsers(String raw) {
        String myUserId = safe(sessionStore.getUserId());
        List<UserItem> out = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.optJSONObject(i);
                if (obj == null) continue;

                UserItem user = new UserItem();
                user.id = readFirst(obj, "id", "userId", "user_id");
                if (user.id.isEmpty() || user.id.equals(myUserId)) continue;
                user.name = readFirst(obj, "name");
                if (user.name.isEmpty()) user.name = getString(R.string.user_fallback);
                user.role = readFirst(obj, "role").equalsIgnoreCase("patron")
                        ? getString(R.string.role_captain)
                        : getString(R.string.role_traveler);
                user.averageRating = readDouble(obj, "averageRating", "average_rating", "rating");
                user.reviewCount = readInt(obj, "reviewCount", "review_count");
                out.add(user);
            }
        } catch (Throwable ignored) {
        }
        return out;
    }

    private void renderList() {
        List<FavoriteAdapter.Item> display = showTop ? buildTopUsersList() : buildSearchOrFavoritesList();
        adapter.submit(display);
        empty.setVisibility(display.isEmpty() ? View.VISIBLE : View.GONE);
        if (showTop && display.isEmpty()) {
            empty.setText(getString(R.string.favorites_top_empty));
        } else if (!query.isEmpty() && display.isEmpty()) {
            empty.setText(getString(R.string.favorites_search_empty));
        } else {
            empty.setText(getString(R.string.favorites_empty));
        }
    }

    private List<FavoriteAdapter.Item> buildSearchOrFavoritesList() {
        String q = query.toLowerCase(Locale.ROOT);
        List<FavoriteAdapter.Item> list = new ArrayList<>();

        for (FavoriteAdapter.Item fav : favoriteItems) {
            if (!matchesQuery(fav.name, fav.role, fav.meta, q)) continue;
            FavoriteAdapter.Item item = cloneFavorite(fav);
            item.primaryText = getString(R.string.common_chat);
            item.showPrimary = true;
            item.secondaryText = getString(R.string.common_remove);
            item.showSecondary = true;
            list.add(item);
        }

        if (q.isEmpty()) return list;

        for (UserItem user : allUsers) {
            if (favoriteIds.contains(user.id)) continue;
            if (!matchesQuery(user.name, user.role, "", q)) continue;
            list.add(fromUser(user, false));
        }
        return list;
    }

    private List<FavoriteAdapter.Item> buildTopUsersList() {
        List<UserItem> ranked = new ArrayList<>();
        for (UserItem user : allUsers) {
            if (user.averageRating > 0) ranked.add(user);
        }
        ranked.sort(Comparator.comparingDouble((UserItem user) -> user.averageRating).reversed()
                .thenComparingInt(user -> -user.reviewCount)
                .thenComparing(user -> user.name));

        List<FavoriteAdapter.Item> out = new ArrayList<>();
        int max = Math.min(ranked.size(), 10);
        for (int i = 0; i < max; i++) {
            FavoriteAdapter.Item item = fromUser(ranked.get(i), favoriteIds.contains(ranked.get(i).id));
            item.meta = "#" + (i + 1) + "  ⭐ " + formatRating(ranked.get(i).averageRating) + " · "
                    + ranked.get(i).reviewCount + " " + getString(R.string.favorites_reviews_suffix);
            out.add(item);
        }
        return out;
    }

    private FavoriteAdapter.Item fromUser(UserItem user, boolean isFavorite) {
        FavoriteAdapter.Item item = new FavoriteAdapter.Item();
        item.id = user.id;
        item.name = user.name;
        item.role = user.role;
        item.meta = user.averageRating > 0
                ? "⭐ " + formatRating(user.averageRating) + " · " + user.reviewCount + " " + getString(R.string.favorites_reviews_suffix)
                : "";
        if (isFavorite) {
            item.primaryText = getString(R.string.common_chat);
            item.showPrimary = true;
            item.secondaryText = getString(R.string.common_remove);
            item.showSecondary = true;
        } else {
            item.primaryText = getString(R.string.favorites_add_cta);
            item.showPrimary = true;
            item.secondaryText = getString(R.string.common_chat);
            item.showSecondary = true;
        }
        return item;
    }

    private static FavoriteAdapter.Item cloneFavorite(FavoriteAdapter.Item raw) {
        FavoriteAdapter.Item out = new FavoriteAdapter.Item();
        out.id = raw.id;
        out.name = raw.name;
        out.role = raw.role;
        out.meta = raw.meta;
        out.primaryText = raw.primaryText;
        out.secondaryText = raw.secondaryText;
        out.showPrimary = raw.showPrimary;
        out.showSecondary = raw.showSecondary;
        return out;
    }

    private static boolean matchesQuery(String left, String mid, String right, String query) {
        if (query == null || query.isEmpty()) return true;
        String text = (safe(left) + " " + safe(mid) + " " + safe(right)).toLowerCase(Locale.ROOT);
        return text.contains(query);
    }

    private String formatRating(double rating) {
        return String.format(Locale.ROOT, "%.1f", Math.max(0, rating));
    }

    private void addFavorite(FavoriteAdapter.Item item) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty() || item.id.isEmpty()) return;

        String payload = "{\"userId\":\"" + userId + "\",\"favoriteUserId\":\"" + item.id + "\"}";
        favoriteActions.addFavorite(payload, new UiApiCallback(FavoritesFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(requireActivity(), getString(R.string.favorites_add_ok));
                load(false);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.favorites_add_error));
            }
        });
    }

    private void removeFavorite(FavoriteAdapter.Item item) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty() || item.id.isEmpty()) return;

        favoriteActions.removeFavorite(userId, item.id, new UiApiCallback(FavoritesFragment.this) {
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

    private void startChat(String otherUserId, String otherUserName) {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty() || safe(otherUserId).isEmpty()) return;

        String payload = "{\"userId1\":\"" + userId + "\",\"userId2\":\"" + otherUserId + "\",\"tripId\":null}";
        messageActions.createOrGetConversation(payload, new UiApiCallback(FavoritesFragment.this) {
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
                intent.putExtra("otherUserId", otherUserId);
                intent.putExtra("otherUserName", safe(otherUserName).isEmpty() ? getString(R.string.user_fallback) : otherUserName);
                startActivity(intent);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.favorites_open_chat_error));
            }
        });
    }

    private static double readDouble(JSONObject obj, String... keys) {
        for (String key : keys) {
            if (!obj.has(key)) continue;
            try {
                return obj.optDouble(key, 0);
            } catch (Throwable ignored) {
            }
        }
        return 0;
    }

    private static int readInt(JSONObject obj, String... keys) {
        for (String key : keys) {
            if (!obj.has(key)) continue;
            try {
                return Math.max(0, obj.optInt(key, 0));
            } catch (Throwable ignored) {
            }
        }
        return 0;
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
