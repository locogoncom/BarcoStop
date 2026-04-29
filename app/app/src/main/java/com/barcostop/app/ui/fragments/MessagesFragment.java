package com.barcostop.app.ui.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
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
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.ConversationAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.ChatActivity;
import com.barcostop.app.ui.screens.MainAppActivity;
import com.barcostop.app.ui.screens.NewChatActivity;
import com.barcostop.app.ui.util.KeyboardUtils;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class MessagesFragment extends Fragment {
    private MessageActions messageActions;
    private SessionStore sessionStore;

    private ConversationAdapter adapter;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar loadingView;
    private TextView emptyView;
    private final List<ConversationAdapter.Item> allItems = new ArrayList<>();
    private String query = "";

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_messages, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        BarcoStopApplication app = (BarcoStopApplication) requireActivity().getApplication();
        messageActions = new MessageActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        swipeRefresh = view.findViewById(R.id.messages_swipe);
        loadingView = view.findViewById(R.id.messages_loading);
        emptyView = view.findViewById(R.id.messages_empty);
        EditText searchInput = view.findViewById(R.id.messages_search);

        RecyclerView recyclerView = view.findViewById(R.id.messages_recycler);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new ConversationAdapter(item -> {
            Intent intent = new Intent(requireContext(), ChatActivity.class);
            intent.putExtra("conversationId", item.id);
            intent.putExtra("otherUserId", item.otherUserId);
            intent.putExtra("otherUserName", item.otherUserName);
            startActivity(intent);
        });
        recyclerView.setAdapter(adapter);

        android.widget.Button newChatButton = view.findViewById(R.id.messages_new_chat);
        newChatButton.setOnClickListener(v -> startActivity(new Intent(requireContext(), NewChatActivity.class)));

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                query = s == null ? "" : s.toString().trim();
                renderConversations();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
        searchInput.setOnEditorActionListener((v, actionId, event) -> {
            KeyboardUtils.hide(requireContext(), v);
            v.clearFocus();
            return false;
        });

        swipeRefresh.setOnRefreshListener(() -> loadConversations(false));
        loadConversations(true);
    }

    private void loadConversations(boolean firstLoad) {
        String userId = sessionStore.getUserId();
        if (userId == null || userId.trim().isEmpty()) {
            emptyView.setVisibility(View.VISIBLE);
            loadingView.setVisibility(View.GONE);
            swipeRefresh.setRefreshing(false);
            return;
        }

        if (firstLoad) {
            loadingView.setVisibility(View.VISIBLE);
            emptyView.setVisibility(View.GONE);
        }

        messageActions.getConversations(userId, new UiApiCallback(MessagesFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                loadingView.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);

                List<ConversationAdapter.Item> items = parseConversations(body);
                allItems.clear();
                allItems.addAll(items);
                renderConversations();
            }

            @Override
            public void onUiError(Throwable throwable) {
                loadingView.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                emptyView.setVisibility(View.VISIBLE);

                if (throwable != null && throwable.getMessage() != null && throwable.getMessage().startsWith("JWT_")) {
                    if (requireActivity() instanceof MainAppActivity) {
                        ((MainAppActivity) requireActivity()).forceLogoutToHome();
                        return;
                    }
                }

                FeedbackFx.error(requireActivity(), getString(R.string.messages_load_error));
            }
        });
    }

    private void renderConversations() {
        List<ConversationAdapter.Item> toShow = filter(allItems, query);
        adapter.submit(toShow);
        emptyView.setVisibility(toShow.isEmpty() ? View.VISIBLE : View.GONE);
    }

    private static List<ConversationAdapter.Item> filter(List<ConversationAdapter.Item> input, String rawQuery) {
        if (rawQuery == null || rawQuery.trim().isEmpty()) {
            return new ArrayList<>(input);
        }
        String query = rawQuery.toLowerCase();
        List<ConversationAdapter.Item> out = new ArrayList<>();
        for (ConversationAdapter.Item item : input) {
            String haystack = (safe(item.otherUserName) + " " + safe(item.lastMessage)).toLowerCase();
            if (haystack.contains(query)) out.add(item);
        }
        return out;
    }

    private List<ConversationAdapter.Item> parseConversations(String rawBody) {
        List<ConversationAdapter.Item> list = new ArrayList<>();
        try {
            JSONArray array = new JSONArray(rawBody);
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.optJSONObject(i);
                if (obj == null) continue;

                ConversationAdapter.Item item = new ConversationAdapter.Item();
                item.id = readFirst(obj, "id", "conversationId", "conversation_id");
                item.otherUserId = readFirst(obj, "otherUserId", "other_user_id");
                item.otherUserName = readFirst(obj, "otherUserName", "other_user_name");
                if (item.otherUserName.isEmpty()) item.otherUserName = getString(R.string.user_fallback);
                item.lastMessage = readFirst(obj, "lastMessage", "last_message");
                item.lastMessageTime = readFirst(obj, "lastMessageTime", "last_message_time", "updatedAt", "updated_at");
                item.unreadCount = readInt(obj, "unreadCount", "unread_count");

                if (!item.id.isEmpty()) {
                    list.add(item);
                }
            }
        } catch (Throwable ignored) {
        }
        return list;
    }

    private static String readFirst(JSONObject obj, String... keys) {
        for (String key : keys) {
            String value = obj.optString(key, "").trim();
            if (!value.isEmpty()) return value;
        }
        return "";
    }

    private static int readInt(JSONObject obj, String... keys) {
        for (String key : keys) {
            try {
                if (!obj.has(key)) continue;
                return Math.max(0, obj.optInt(key, 0));
            } catch (Throwable ignored) {
            }
        }
        return 0;
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
