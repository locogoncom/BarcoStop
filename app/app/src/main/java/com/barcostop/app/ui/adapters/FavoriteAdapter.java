package com.barcostop.app.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;

import java.util.ArrayList;
import java.util.List;

public class FavoriteAdapter extends RecyclerView.Adapter<FavoriteAdapter.ViewHolder> {
    public interface Actions {
        void onChat(Item item);
        void onRemove(Item item);
    }

    public static class Item {
        public String id = "";
        public String name = "";
        public String role = "";
    }

    private final List<Item> items = new ArrayList<>();
    private final Actions actions;

    public FavoriteAdapter(Actions actions) {
        this.actions = actions;
    }

    public void submit(List<Item> newItems) {
        items.clear();
        items.addAll(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_favorite, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        holder.name.setText(item.name);
        holder.role.setText(item.role);
        holder.chat.setOnClickListener(v -> actions.onChat(item));
        holder.remove.setOnClickListener(v -> actions.onRemove(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView role;
        final Button chat;
        final Button remove;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.fav_name);
            role = itemView.findViewById(R.id.fav_role);
            chat = itemView.findViewById(R.id.fav_chat);
            remove = itemView.findViewById(R.id.fav_remove);
        }
    }
}
