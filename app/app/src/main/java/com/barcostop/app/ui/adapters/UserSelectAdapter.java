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

public class UserSelectAdapter extends RecyclerView.Adapter<UserSelectAdapter.ViewHolder> {
    public interface UserClick {
        void onClick(Item item);
    }

    public static class Item {
        public String id = "";
        public String name = "";
        public String role = "";
    }

    private final List<Item> items = new ArrayList<>();
    private final UserClick userClick;

    public UserSelectAdapter(UserClick userClick) {
        this.userClick = userClick;
    }

    public void submit(List<Item> newItems) {
        items.clear();
        items.addAll(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_user_select, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        holder.name.setText(item.name);
        holder.role.setText(item.role);
        holder.itemView.setOnClickListener(v -> userClick.onClick(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView role;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.user_select_name);
            role = itemView.findViewById(R.id.user_select_role);
        }
    }
}
