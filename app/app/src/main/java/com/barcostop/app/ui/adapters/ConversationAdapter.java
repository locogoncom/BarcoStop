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

public class ConversationAdapter extends RecyclerView.Adapter<ConversationAdapter.ViewHolder> {
    public interface OnConversationClick {
        void onClick(Item item);
    }

    public static class Item {
        public String id = "";
        public String otherUserId = "";
        public String otherUserName = "";
        public String lastMessage = "";
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
        holder.name.setText(item.otherUserName);
        holder.lastMessage.setText(item.lastMessage == null || item.lastMessage.trim().isEmpty() ? "-" : item.lastMessage);
        holder.itemView.setOnClickListener(v -> onConversationClick.onClick(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView lastMessage;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.tv_conversation_name);
            lastMessage = itemView.findViewById(R.id.tv_conversation_last_message);
        }
    }
}
