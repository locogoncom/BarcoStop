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

public class BoatManageAdapter extends RecyclerView.Adapter<BoatManageAdapter.ViewHolder> {
    public interface Actions {
        void onEdit(Item item);
        void onDelete(Item item);
    }

    public static class Item {
        public String id = "";
        public String name = "";
        public String type = "";
        public int capacity = 1;
        public String safety = "";
        public String description = "";
    }

    private final List<Item> items = new ArrayList<>();
    private final Actions actions;

    public BoatManageAdapter(Actions actions) {
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
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_boat_manage, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        holder.name.setText(item.name);
        holder.meta.setText(item.type + " · " + item.capacity + " pax");
        holder.safety.setText(item.safety.isEmpty() ? item.description : item.safety);
        holder.edit.setOnClickListener(v -> actions.onEdit(item));
        holder.delete.setOnClickListener(v -> actions.onDelete(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView meta;
        final TextView safety;
        final Button edit;
        final Button delete;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.boat_item_name);
            meta = itemView.findViewById(R.id.boat_item_meta);
            safety = itemView.findViewById(R.id.boat_item_safety);
            edit = itemView.findViewById(R.id.boat_item_edit);
            delete = itemView.findViewById(R.id.boat_item_delete);
        }
    }
}
