package com.barcostop.app.ui.screens;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.widget.Button;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.ChatMessageAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ChatActivity extends AppCompatActivity {
    private static final long POLL_MS = 5000L;

    private MessageActions messageActions;
    private SessionStore sessionStore;

    private ChatMessageAdapter adapter;
    private EditText input;
    private RecyclerView recycler;
    private String conversationId = "";
    private String currentUserId = "";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            loadMessages();
            handler.postDelayed(this, POLL_MS);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        messageActions = new MessageActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        currentUserId = safe(sessionStore.getUserId());
        conversationId = safe(getIntent().getStringExtra("conversationId"));
        String otherName = safe(getIntent().getStringExtra("otherUserName"));
        setTitle(otherName.isEmpty() ? "Chat" : otherName);

        recycler = findViewById(R.id.chat_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        adapter = new ChatMessageAdapter(currentUserId);
        recycler.setAdapter(adapter);
        if (recycler.getItemAnimator() instanceof DefaultItemAnimator) {
            ((DefaultItemAnimator) recycler.getItemAnimator()).setSupportsChangeAnimations(false);
        }

        input = findViewById(R.id.chat_input);
        Button send = findViewById(R.id.chat_send);
        send.setOnClickListener(v -> sendMessage());

        if (conversationId.isEmpty() || currentUserId.isEmpty()) {
            FeedbackFx.error(this, "Invalid chat");
            finish();
            return;
        }

        loadMessages();
    }

    @Override
    protected void onResume() {
        super.onResume();
        handler.postDelayed(pollRunnable, POLL_MS);
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(pollRunnable);
    }

    private void loadMessages() {
        messageActions.getConversationMessages(conversationId, currentUserId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONArray array = new JSONArray(body);
                    List<ChatMessageAdapter.Item> items = new ArrayList<>();
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject obj = array.optJSONObject(i);
                        if (obj == null) continue;

                        ChatMessageAdapter.Item item = new ChatMessageAdapter.Item();
                        item.id = readFirst(obj, "id");
                        item.senderId = readFirst(obj, "senderId", "sender_id");
                        item.content = readFirst(obj, "content", "message");
                        item.createdAt = shortTime(readFirst(obj, "created_at", "createdAt"));
                        items.add(item);
                    }
                    adapter.submit(items);
                    if (!items.isEmpty()) {
                        recycler.scrollToPosition(items.size() - 1);
                    }
                } catch (Throwable ignored) {
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                if (throwable != null && throwable.getMessage() != null && throwable.getMessage().startsWith("JWT_")) {
                    sessionStore.clearSession();
                    finish();
                }
            }
        });
    }

    private void sendMessage() {
        String content = safe(input.getText() == null ? "" : input.getText().toString());
        if (content.isEmpty()) return;

        try {
            JSONObject payload = new JSONObject();
            payload.put("conversationId", conversationId);
            payload.put("senderId", currentUserId);
            payload.put("content", content);

            messageActions.sendMessage(payload.toString(), new UiApiCallback(this) {
                @Override
                public void onUiSuccess(String body) {
                    input.setText("");
                    loadMessages();
                }

                @Override
                public void onUiError(Throwable throwable) {
                    FeedbackFx.error(ChatActivity.this, "Could not send message");
                }
            });
        } catch (Throwable throwable) {
            FeedbackFx.error(this, "Could not send message");
        }
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

    private static String shortTime(String raw) {
        if (raw == null) return "";
        String value = raw.trim();
        if (value.isEmpty()) return "";

        int t = value.indexOf('T');
        if (t > 0) {
            value = value.substring(t + 1);
        } else {
            int s = value.indexOf(' ');
            if (s > 0) value = value.substring(s + 1);
        }

        if (value.length() >= 5) {
            return value.substring(0, 5);
        }
        return value;
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
