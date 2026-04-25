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
import com.barcostop.app.core.actions.MessageActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.ConversationAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.ChatActivity;
import com.barcostop.app.ui.screens.MainAppActivity;
import com.barcostop.app.ui.screens.NewChatActivity;

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

        messageActions.getConversations(userId, new UiApiCallback((androidx.appcompat.app.AppCompatActivity) requireActivity()) {
            @Override
            public void onUiSuccess(String body) {
                loadingView.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);

                List<ConversationAdapter.Item> items = parseConversations(body);
                adapter.submit(items);
                emptyView.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
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
