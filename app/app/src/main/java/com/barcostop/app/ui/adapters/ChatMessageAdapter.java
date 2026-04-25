package com.barcostop.app.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;

import java.util.ArrayList;
import java.util.List;

public class ChatMessageAdapter extends RecyclerView.Adapter<ChatMessageAdapter.ViewHolder> {
    private static final int TYPE_MINE = 1;
    private static final int TYPE_OTHER = 2;

    public static class Item {
        public String id = "";
        public String senderId = "";
        public String content = "";
        public String createdAt = "";
    }

    private final List<Item> items = new ArrayList<>();
    private final String currentUserId;

    public ChatMessageAdapter(String currentUserId) {
        this.currentUserId = currentUserId == null ? "" : currentUserId.trim();
    }

    public void submit(List<Item> newItems) {
        items.clear();
        items.addAll(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layout = viewType == TYPE_MINE
                ? R.layout.item_chat_message_outgoing
                : R.layout.item_chat_message_incoming;
        View view = LayoutInflater.from(parent.getContext()).inflate(layout, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public int getItemViewType(int position) {
        String senderId = items.get(position).senderId == null ? "" : items.get(position).senderId;
        return senderId.equals(currentUserId) ? TYPE_MINE : TYPE_OTHER;
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        holder.message.setText(item.content == null ? "" : item.content);
        if (holder.time != null) {
            holder.time.setText(item.createdAt == null ? "" : item.createdAt);
        }
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView message;
        final TextView time;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            message = itemView.findViewById(R.id.chat_message_text);
            time = itemView.findViewById(R.id.chat_message_time);
        }
    }
}
