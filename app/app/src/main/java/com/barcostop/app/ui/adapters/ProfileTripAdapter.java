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

public class ProfileTripAdapter extends RecyclerView.Adapter<ProfileTripAdapter.ViewHolder> {
    public interface Actions {
        void onShare(Item item);
    }

    public static class Item {
        public String tripId = "";
        public String title = "";
        public String subtitle = "";
        public String shareText = "";
    }

    private final List<Item> items = new ArrayList<>();
    private final Actions actions;

    public ProfileTripAdapter(Actions actions) {
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
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_profile_trip, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        holder.title.setText(item.title);
        holder.subtitle.setText(item.subtitle);
        holder.share.setOnClickListener(v -> actions.onShare(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView title;
        final TextView subtitle;
        final Button share;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            title = itemView.findViewById(R.id.profile_trip_title);
            subtitle = itemView.findViewById(R.id.profile_trip_subtitle);
            share = itemView.findViewById(R.id.profile_trip_share);
        }
    }
}
