package com.barcostop.app.ui.screens;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.FavoriteActions;
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.actions.UserActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.UserBrowseAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class UsersActivity extends AppCompatActivity {
    private UserActions userActions;
    private FavoriteActions favoriteActions;
    private MessageActions messageActions;
    private SessionStore sessionStore;

    private ProgressBar loading;
    private TextView empty;
    private UserBrowseAdapter adapter;
    private final List<UserBrowseAdapter.Item> allUsers = new ArrayList<>();
    private final Set<String> favoriteIds = new HashSet<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_users);
        setTitle(R.string.screen_users);

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        userActions = new UserActions(app.getApiClient());
        favoriteActions = new FavoriteActions(app.getApiClient());
        messageActions = new MessageActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        loading = findViewById(R.id.users_loading);
        empty = findViewById(R.id.users_empty);
        EditText search = findViewById(R.id.users_search);

        RecyclerView recycler = findViewById(R.id.users_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        adapter = new UserBrowseAdapter(new UserBrowseAdapter.Actions() {
            @Override
            public void onProfile(UserBrowseAdapter.Item item) {
                Intent intent = new Intent(UsersActivity.this, UserPublicProfileActivity.class);
                intent.putExtra("userId", item.id);
                startActivity(intent);
            }

            @Override
            public void onChat(UserBrowseAdapter.Item item) {
                openChat(item);
            }

            @Override
            public void onToggleFavorite(UserBrowseAdapter.Item item) {
                toggleFavorite(item);
            }
        });
        recycler.setAdapter(adapter);

        search.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterUsers(s == null ? "" : s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });

        loadData();
    }

    private void loadData() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            finish();
            return;
        }
        loading.setVisibility(View.VISIBLE);
        favoriteActions.listFavorites(userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                favoriteIds.clear();
                try {
                    JSONArray arr = new JSONArray(body);
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.optJSONObject(i);
                        if (obj == null) continue;
                        String id = readFirst(obj, "favoriteUserId", "id");
                        if (!id.isEmpty()) favoriteIds.add(id);
                    }
                } catch (Throwable ignored) {
                }
                loadUsers();
            }

            @Override
            public void onUiError(Throwable throwable) {
                favoriteIds.clear();
                loadUsers();
            }
        });
    }

    private void loadUsers() {
        String me = safe(sessionStore.getUserId());
        userActions.getUsers(new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                loading.setVisibility(View.GONE);
                allUsers.clear();
                try {
                    JSONArray arr = new JSONArray(body);
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject user = arr.optJSONObject(i);
                        if (user == null) continue;
                        String id = readFirst(user, "id", "userId", "user_id");
                        if (id.isEmpty() || id.equals(me)) continue;

                        UserBrowseAdapter.Item item = new UserBrowseAdapter.Item();
                        item.id = id;
                        item.name = readFirst(user, "name");
                        item.role = readFirst(user, "role").equalsIgnoreCase("patron")
                                ? getString(R.string.role_captain)
                                : getString(R.string.role_traveler);
                        item.isFavorite = favoriteIds.contains(id);
                        allUsers.add(item);
                    }
                } catch (Throwable ignored) {
                }
                adapter.submit(new ArrayList<>(allUsers));
                empty.setVisibility(allUsers.isEmpty() ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                empty.setVisibility(View.VISIBLE);
                FeedbackFx.error(UsersActivity.this, getString(R.string.users_load_error));
            }
        });
    }

    private void filterUsers(String query) {
        String q = safe(query).toLowerCase();
        if (q.isEmpty()) {
            adapter.submit(new ArrayList<>(allUsers));
            empty.setVisibility(allUsers.isEmpty() ? View.VISIBLE : View.GONE);
            return;
        }
        List<UserBrowseAdapter.Item> filtered = new ArrayList<>();
        for (UserBrowseAdapter.Item item : allUsers) {
            if (item.name.toLowerCase().contains(q) || item.role.toLowerCase().contains(q)) {
                filtered.add(item);
            }
        }
        adapter.submit(filtered);
        empty.setVisibility(filtered.isEmpty() ? View.VISIBLE : View.GONE);
    }

    private void openChat(UserBrowseAdapter.Item item) {
        String myId = safe(sessionStore.getUserId());
        if (myId.isEmpty() || item.id.isEmpty()) return;
        String payload = "{\"userId1\":\"" + myId + "\",\"userId2\":\"" + item.id + "\",\"tripId\":null}";
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
                    FeedbackFx.error(UsersActivity.this, getString(R.string.users_chat_open_error));
                    return;
                }
                Intent intent = new Intent(UsersActivity.this, ChatActivity.class);
                intent.putExtra("conversationId", conversationId);
                intent.putExtra("otherUserId", item.id);
                intent.putExtra("otherUserName", item.name);
                startActivity(intent);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(UsersActivity.this, getString(R.string.users_chat_open_error));
            }
        });
    }

    private void toggleFavorite(UserBrowseAdapter.Item item) {
        String myId = safe(sessionStore.getUserId());
        if (myId.isEmpty() || item.id.isEmpty()) return;

        if (item.isFavorite) {
            favoriteActions.removeFavorite(myId, item.id, new UiApiCallback(this) {
                @Override
                public void onUiSuccess(String body) {
                    item.isFavorite = false;
                    favoriteIds.remove(item.id);
                    adapter.submit(new ArrayList<>(allUsers));
                    FeedbackFx.success(UsersActivity.this, getString(R.string.users_favorite_removed));
                }

                @Override
                public void onUiError(Throwable throwable) {
                    FeedbackFx.error(UsersActivity.this, getString(R.string.users_favorite_remove_error));
                }
            });
            return;
        }

        String payload = "{\"userId\":\"" + myId + "\",\"favoriteUserId\":\"" + item.id + "\"}";
        favoriteActions.addFavorite(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                item.isFavorite = true;
                favoriteIds.add(item.id);
                adapter.submit(new ArrayList<>(allUsers));
                FeedbackFx.success(UsersActivity.this, getString(R.string.users_favorite_added));
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(UsersActivity.this, getString(R.string.users_favorite_add_error));
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
