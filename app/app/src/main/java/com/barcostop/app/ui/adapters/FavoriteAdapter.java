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
import java.util.Locale;

public class FavoriteAdapter extends RecyclerView.Adapter<FavoriteAdapter.ViewHolder> {
    public interface Actions {
        void onPrimary(Item item);
        void onSecondary(Item item);
        void onProfile(Item item);
    }

    public static class Item {
        public String id = "";
        public String name = "";
        public String role = "";
        public String meta = "";
        public boolean showPrimary = true;
        public boolean showSecondary = false;
        public String primaryText = "";
        public String secondaryText = "";
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
        String name = item.name == null || item.name.trim().isEmpty() ? "-" : item.name.trim();
        String role = item.role == null || item.role.trim().isEmpty() ? "" : item.role.trim();
        holder.avatar.setText(name.substring(0, 1).toUpperCase(Locale.getDefault()));
        holder.name.setText(name);
        if (role.isEmpty()) {
            holder.role.setVisibility(View.GONE);
        } else {
            holder.role.setVisibility(View.VISIBLE);
            holder.role.setText(role);
        }
        String meta = item.meta == null ? "" : item.meta.trim();
        if (meta.isEmpty()) {
            holder.meta.setVisibility(View.GONE);
        } else {
            holder.meta.setVisibility(View.VISIBLE);
            holder.meta.setText(meta);
        }

        holder.primary.setVisibility(item.showPrimary ? View.VISIBLE : View.GONE);
        holder.secondary.setVisibility(item.showSecondary ? View.VISIBLE : View.GONE);
        holder.primary.setText(item.primaryText == null || item.primaryText.trim().isEmpty()
                ? holder.primary.getContext().getString(R.string.common_chat)
                : item.primaryText.trim());
        holder.secondary.setText(item.secondaryText == null || item.secondaryText.trim().isEmpty()
                ? holder.secondary.getContext().getString(R.string.common_remove)
                : item.secondaryText.trim());

        holder.primary.setOnClickListener(v -> actions.onPrimary(item));
        holder.secondary.setOnClickListener(v -> actions.onSecondary(item));
        holder.itemView.setOnClickListener(v -> actions.onProfile(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView avatar;
        final TextView name;
        final TextView role;
        final TextView meta;
        final Button primary;
        final Button secondary;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.fav_avatar);
            name = itemView.findViewById(R.id.fav_name);
            role = itemView.findViewById(R.id.fav_role);
            meta = itemView.findViewById(R.id.fav_meta);
            primary = itemView.findViewById(R.id.fav_primary);
            secondary = itemView.findViewById(R.id.fav_secondary);
        }
    }
}
