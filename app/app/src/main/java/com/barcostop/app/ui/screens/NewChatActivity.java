package com.barcostop.app.ui.screens;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import android.widget.ProgressBar;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.actions.UserActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.UserSelectAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class NewChatActivity extends AppCompatActivity {
    private UserActions userActions;
    private MessageActions messageActions;
    private SessionStore sessionStore;

    private ProgressBar loading;
    private UserSelectAdapter adapter;

    private final List<UserSelectAdapter.Item> allUsers = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_new_chat);
        setTitle(R.string.new_chat_title);

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        userActions = new UserActions(app.getApiClient());
        messageActions = new MessageActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        loading = findViewById(R.id.new_chat_loading);
        EditText search = findViewById(R.id.new_chat_search);

        RecyclerView recycler = findViewById(R.id.new_chat_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        adapter = new UserSelectAdapter(this::startChatWithUser);
        recycler.setAdapter(adapter);

        search.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filter(s == null ? "" : s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });

        loadUsers();
    }

    private void loadUsers() {
        String currentUserId = safe(sessionStore.getUserId());
        if (currentUserId.isEmpty()) {
            finish();
            return;
        }

        loading.setVisibility(View.VISIBLE);
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
                        if (id.isEmpty() || id.equals(currentUserId)) continue;

                        UserSelectAdapter.Item item = new UserSelectAdapter.Item();
                        item.id = id;
                        item.name = readFirst(user, "name", "username");
                        if (item.name.isEmpty()) item.name = getString(R.string.user_fallback);
                        String role = readFirst(user, "role");
                        item.role = role.equalsIgnoreCase("patron")
                                ? getString(R.string.role_captain)
                                : getString(R.string.role_traveler);
                        allUsers.add(item);
                    }
                } catch (Throwable ignored) {
                }

                adapter.submit(new ArrayList<>(allUsers));
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                FeedbackFx.error(NewChatActivity.this, getString(R.string.new_chat_load_users_error));
            }
        });
    }

    private void filter(String query) {
        String q = safe(query).toLowerCase();
        if (q.isEmpty()) {
            adapter.submit(new ArrayList<>(allUsers));
            return;
        }

        List<UserSelectAdapter.Item> filtered = new ArrayList<>();
        for (UserSelectAdapter.Item item : allUsers) {
            if (item.name.toLowerCase().contains(q)) {
                filtered.add(item);
            }
        }
        adapter.submit(filtered);
    }

    private void startChatWithUser(UserSelectAdapter.Item item) {
        String currentUserId = safe(sessionStore.getUserId());
        if (currentUserId.isEmpty() || item.id.isEmpty()) return;

        String payload = "{\"userId1\":\"" + currentUserId + "\",\"userId2\":\"" + item.id + "\",\"tripId\":null}";
        loading.setVisibility(View.VISIBLE);
        messageActions.createOrGetConversation(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                loading.setVisibility(View.GONE);

                String conversationId = "";
                try {
                    JSONObject data = new JSONObject(body);
                    conversationId = readFirst(data, "id", "conversationId", "conversation_id");
                } catch (Throwable ignored) {
                }

                if (conversationId.isEmpty()) {
                    FeedbackFx.error(NewChatActivity.this, getString(R.string.new_chat_create_error));
                    return;
                }

                Intent intent = new Intent(NewChatActivity.this, ChatActivity.class);
                intent.putExtra("conversationId", conversationId);
                intent.putExtra("otherUserId", item.id);
                intent.putExtra("otherUserName", item.name);
                startActivity(intent);
                finish();
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                FeedbackFx.error(NewChatActivity.this, getString(R.string.new_chat_create_error));
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
