package com.barcostop.app.ui.screens;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

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
import com.google.android.material.appbar.MaterialToolbar;

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
    private String otherUserId = "";
    private String otherUserName = "";
    private boolean blocked = false;
    private boolean blockedByMe = false;
    private boolean blockedByOther = false;
    private boolean moderating = false;
    private Button reportButton;
    private Button blockButton;
    private TextView blockBanner;
    private View safetyRow;

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
        otherUserId = safe(getIntent().getStringExtra("otherUserId"));
        otherUserName = safe(getIntent().getStringExtra("otherUserName"));

        MaterialToolbar toolbar = findViewById(R.id.chat_toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(otherUserName.isEmpty() ? getString(R.string.screen_chat) : otherUserName);
        }

        recycler = findViewById(R.id.chat_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        adapter = new ChatMessageAdapter(currentUserId);
        recycler.setAdapter(adapter);
        if (recycler.getItemAnimator() instanceof DefaultItemAnimator) {
            ((DefaultItemAnimator) recycler.getItemAnimator()).setSupportsChangeAnimations(false);
        }

        input = findViewById(R.id.chat_input);
        Button send = findViewById(R.id.chat_send);
        reportButton = findViewById(R.id.chat_report_btn);
        blockButton = findViewById(R.id.chat_block_btn);
        blockBanner = findViewById(R.id.chat_block_banner);
        safetyRow = findViewById(R.id.chat_safety_row);
        send.setOnClickListener(v -> sendMessage());
        reportButton.setOnClickListener(v -> showReportDialog());
        blockButton.setOnClickListener(v -> toggleBlock());

        if (conversationId.isEmpty() || currentUserId.isEmpty()) {
            FeedbackFx.error(this, getString(R.string.chat_invalid));
            finish();
            return;
        }

        updateSafetyUi();
        if (!otherUserId.isEmpty()) {
            loadBlockStatus();
        }
        loadMessages();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    protected void onResume() {
        super.onResume();
        handler.postDelayed(pollRunnable, POLL_MS);
        if (!otherUserId.isEmpty()) {
            loadBlockStatus();
        }
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
        if (blocked) {
            FeedbackFx.info(this, blockedByMe
                    ? getString(R.string.chat_blocked_by_me)
                    : getString(R.string.chat_blocked_by_other));
            return;
        }

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
                    FeedbackFx.error(ChatActivity.this, getString(R.string.chat_send_error));
                }
            });
        } catch (Throwable throwable) {
            FeedbackFx.error(this, getString(R.string.chat_send_error));
        }
    }

    private void loadBlockStatus() {
        if (currentUserId.isEmpty() || otherUserId.isEmpty()) {
            return;
        }

        messageActions.getBlockStatus(currentUserId, otherUserId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject json = new JSONObject(body);
                    blocked = json.optBoolean("blocked", false);
                    blockedByMe = json.optBoolean("blockedByMe", false);
                    blockedByOther = json.optBoolean("blockedByOther", false);
                } catch (Throwable ignored) {
                    blocked = false;
                    blockedByMe = false;
                    blockedByOther = false;
                }
                updateSafetyUi();
            }

            @Override
            public void onUiError(Throwable throwable) {
                updateSafetyUi();
            }
        });
    }

    private void updateSafetyUi() {
        if (reportButton == null || blockButton == null || blockBanner == null || input == null || safetyRow == null) {
            return;
        }

        boolean canModerate = !otherUserId.isEmpty();
        safetyRow.setVisibility(canModerate ? View.VISIBLE : View.GONE);
        reportButton.setVisibility(canModerate ? View.VISIBLE : View.GONE);
        blockButton.setVisibility(canModerate ? View.VISIBLE : View.GONE);
        reportButton.setEnabled(canModerate && !moderating);
        blockButton.setEnabled(canModerate && !moderating && !blockedByOther);
        blockButton.setText(blockedByMe ? getString(R.string.chat_unblock) : getString(R.string.chat_block));

        if (blocked) {
            blockBanner.setVisibility(View.VISIBLE);
            blockBanner.setText(blockedByMe
                    ? getString(R.string.chat_blocked_by_me)
                    : getString(R.string.chat_blocked_by_other));
        } else {
            blockBanner.setVisibility(View.GONE);
            blockBanner.setText("");
        }

        input.setEnabled(!blocked);
    }

    private void toggleBlock() {
        if (otherUserId.isEmpty() || currentUserId.isEmpty() || moderating) return;
        if (blockedByOther) {
            FeedbackFx.info(this, getString(R.string.chat_blocked_by_other));
            return;
        }

        if (blockedByMe) {
            new androidx.appcompat.app.AlertDialog.Builder(this)
                    .setTitle(R.string.chat_unblock)
                    .setMessage(getString(R.string.chat_unblock_confirm, otherUserName.isEmpty() ? getString(R.string.user_fallback) : otherUserName))
                    .setNegativeButton(R.string.common_cancel, null)
                    .setPositiveButton(R.string.chat_unblock, (d, w) -> unblockUser())
                    .show();
            return;
        }

        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(R.string.chat_block)
                .setMessage(getString(R.string.chat_block_confirm, otherUserName.isEmpty() ? getString(R.string.user_fallback) : otherUserName))
                .setNegativeButton(R.string.common_cancel, null)
                .setPositiveButton(R.string.chat_block, (d, w) -> blockUser())
                .show();
    }

    private void blockUser() {
        String payload = "{\"blockerId\":\"" + currentUserId + "\",\"blockedUserId\":\"" + otherUserId + "\",\"reason\":\"chat\"}";
        moderating = true;
        updateSafetyUi();
        messageActions.blockUser(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                moderating = false;
                FeedbackFx.success(ChatActivity.this, getString(R.string.chat_block_done));
                loadBlockStatus();
            }

            @Override
            public void onUiError(Throwable throwable) {
                moderating = false;
                updateSafetyUi();
                FeedbackFx.error(ChatActivity.this, getString(R.string.chat_block_error));
            }
        });
    }

    private void unblockUser() {
        String payload = "{\"blockerId\":\"" + currentUserId + "\",\"blockedUserId\":\"" + otherUserId + "\"}";
        moderating = true;
        updateSafetyUi();
        messageActions.unblockUser(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                moderating = false;
                FeedbackFx.success(ChatActivity.this, getString(R.string.chat_unblock_done));
                loadBlockStatus();
            }

            @Override
            public void onUiError(Throwable throwable) {
                moderating = false;
                updateSafetyUi();
                FeedbackFx.error(ChatActivity.this, getString(R.string.chat_unblock_error));
            }
        });
    }

    private void showReportDialog() {
        if (otherUserId.isEmpty() || currentUserId.isEmpty()) return;

        String[] reasons = new String[]{
                getString(R.string.chat_report_reason_spam),
                getString(R.string.chat_report_reason_abuse),
                getString(R.string.chat_report_reason_inappropriate)
        };
        String[] reasonCodes = new String[]{"spam", "abuse", "inappropriate"};

        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(R.string.chat_report)
                .setItems(reasons, (dialog, which) -> reportUser(reasonCodes[Math.max(0, Math.min(which, reasonCodes.length - 1))]))
                .setNegativeButton(R.string.common_cancel, null)
                .show();
    }

    private void reportUser(String reason) {
        String payload = "{\"reporterId\":\"" + currentUserId + "\",\"reportedUserId\":\"" + otherUserId + "\",\"conversationId\":\"" + conversationId + "\",\"reason\":\"" + reason + "\"}";
        moderating = true;
        updateSafetyUi();
        messageActions.reportUser(payload, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                moderating = false;
                updateSafetyUi();
                FeedbackFx.success(ChatActivity.this, getString(R.string.chat_report_done));
            }

            @Override
            public void onUiError(Throwable throwable) {
                moderating = false;
                updateSafetyUi();
                FeedbackFx.error(ChatActivity.this, getString(R.string.chat_report_error));
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
