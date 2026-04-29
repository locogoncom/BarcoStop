package com.barcostop.app.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class ConversationAdapter extends RecyclerView.Adapter<ConversationAdapter.ViewHolder> {
    public interface OnConversationClick {
        void onClick(Item item);
    }

    public static class Item {
        public String id = "";
        public String otherUserId = "";
        public String otherUserName = "";
        public String lastMessage = "";
        public String lastMessageTime = "";
        public int unreadCount = 0;
    }

    private final List<Item> items = new ArrayList<>();
    private final OnConversationClick onConversationClick;

    public ConversationAdapter(OnConversationClick onConversationClick) {
        this.onConversationClick = onConversationClick;
    }

    public void submit(List<Item> newItems) {
        items.clear();
        items.addAll(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_conversation, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        String displayName = item.otherUserName == null || item.otherUserName.trim().isEmpty() ? "-" : item.otherUserName.trim();
        String preview = item.lastMessage == null || item.lastMessage.trim().isEmpty() ? "-" : item.lastMessage.trim();
        String initial = displayName.substring(0, 1).toUpperCase(Locale.getDefault());

        holder.avatar.setText(initial);
        holder.name.setText(displayName);
        holder.lastMessage.setText(preview);

        String timeLabel = formatConversationTime(item.lastMessageTime);
        if (timeLabel.isEmpty()) {
            holder.time.setVisibility(View.GONE);
        } else {
            holder.time.setVisibility(View.VISIBLE);
            holder.time.setText(timeLabel);
        }

        if (item.unreadCount > 0) {
            holder.unread.setVisibility(View.VISIBLE);
            holder.unread.setText(item.unreadCount > 99 ? "99+" : String.valueOf(item.unreadCount));
        } else {
            holder.unread.setVisibility(View.GONE);
        }

        holder.itemView.setOnClickListener(v -> onConversationClick.onClick(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView avatar;
        final TextView name;
        final TextView lastMessage;
        final TextView time;
        final TextView unread;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.tv_conversation_avatar);
            name = itemView.findViewById(R.id.tv_conversation_name);
            lastMessage = itemView.findViewById(R.id.tv_conversation_last_message);
            time = itemView.findViewById(R.id.tv_conversation_time);
            unread = itemView.findViewById(R.id.tv_conversation_unread);
        }
    }

    private static String formatConversationTime(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "";
        Date date = tryParseDate(raw.trim());
        if (date == null) return "";
        return new SimpleDateFormat("d MMM HH:mm", Locale.getDefault()).format(date);
    }

    private static Date tryParseDate(String value) {
        String[] patterns = new String[] {
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd HH:mm:ss.SSS",
                "yyyy-MM-dd'T'HH:mm:ss",
                "yyyy-MM-dd'T'HH:mm:ss.SSS",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        };

        for (String pattern : patterns) {
            try {
                SimpleDateFormat format = new SimpleDateFormat(pattern, Locale.US);
                format.setLenient(true);
                Date parsed = format.parse(value);
                if (parsed != null) return parsed;
            } catch (Throwable ignored) {
            }
        }
        return null;
    }
}
