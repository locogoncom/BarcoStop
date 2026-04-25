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

public class UserBrowseAdapter extends RecyclerView.Adapter<UserBrowseAdapter.ViewHolder> {
    public interface Actions {
        void onProfile(Item item);
        void onChat(Item item);
        void onToggleFavorite(Item item);
    }

    public static class Item {
        public String id = "";
        public String name = "";
        public String role = "";
        public boolean isFavorite = false;
    }

    private final List<Item> items = new ArrayList<>();
    private final Actions actions;

    public UserBrowseAdapter(Actions actions) {
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
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_user_browse, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        holder.name.setText(item.name);
        holder.role.setText(item.role);
        holder.favorite.setText(item.isFavorite ? R.string.users_favorite_remove : R.string.users_favorite_add);
        holder.profile.setOnClickListener(v -> actions.onProfile(item));
        holder.chat.setOnClickListener(v -> actions.onChat(item));
        holder.favorite.setOnClickListener(v -> actions.onToggleFavorite(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView role;
        final Button profile;
        final Button chat;
        final Button favorite;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.user_browse_name);
            role = itemView.findViewById(R.id.user_browse_role);
            profile = itemView.findViewById(R.id.user_browse_profile);
            chat = itemView.findViewById(R.id.user_browse_chat);
            favorite = itemView.findViewById(R.id.user_browse_favorite);
        }
    }
}
