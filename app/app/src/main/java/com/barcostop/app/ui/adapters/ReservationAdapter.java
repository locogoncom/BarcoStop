package com.barcostop.app.ui.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;

import java.util.ArrayList;
import java.util.List;

public class ReservationAdapter extends RecyclerView.Adapter<ReservationAdapter.ViewHolder> {
    public interface ReservationActions {
        void onPrimary(Item item);
        void onSecondary(Item item);
    }

    public static class Item {
        public String id = "";
        public String tripId = "";
        public String tripTitle = "";
        public String route = "";
        public String status = "pending";
        public String travelerId = "";
        public String travelerName = "";
        public String patronId = "";
        public boolean showPrimary = false;
        public boolean showSecondary = false;
        public String primaryText = "";
        public String secondaryText = "";
    }

    private final List<Item> items = new ArrayList<>();
    private final ReservationActions actions;

    public ReservationAdapter(ReservationActions actions) {
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
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_reservation, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        holder.title.setText(item.tripTitle);
        holder.subtitle.setText(item.route);
        holder.status.setText(statusLabel(holder.itemView, item.status));
        holder.status.setBackgroundColor(statusColor(item.status));

        holder.actions.setVisibility((item.showPrimary || item.showSecondary) ? View.VISIBLE : View.GONE);
        holder.primary.setVisibility(item.showPrimary ? View.VISIBLE : View.GONE);
        holder.secondary.setVisibility(item.showSecondary ? View.VISIBLE : View.GONE);
        holder.primary.setText(item.primaryText);
        holder.secondary.setText(item.secondaryText);

        holder.primary.setOnClickListener(v -> actions.onPrimary(item));
        holder.secondary.setOnClickListener(v -> actions.onSecondary(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    private static int statusColor(String statusRaw) {
        String status = statusRaw == null ? "" : statusRaw.toLowerCase().trim();
        if (status.equals("approved") || status.equals("confirmed")) return Color.parseColor("#16A34A");
        if (status.equals("rejected") || status.equals("cancelled")) return Color.parseColor("#DC2626");
        return Color.parseColor("#D97706");
    }

    private static String statusLabel(View root, String statusRaw) {
        String status = statusRaw == null ? "" : statusRaw.toLowerCase().trim();
        if (status.equals("approved")) return root.getContext().getString(R.string.status_approved);
        if (status.equals("confirmed")) return root.getContext().getString(R.string.status_confirmed);
        if (status.equals("rejected")) return root.getContext().getString(R.string.status_rejected);
        if (status.equals("cancelled")) return root.getContext().getString(R.string.status_cancelled);
        return root.getContext().getString(R.string.status_pending);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView title;
        final TextView subtitle;
        final TextView status;
        final LinearLayout actions;
        final Button primary;
        final Button secondary;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            title = itemView.findViewById(R.id.res_title);
            subtitle = itemView.findViewById(R.id.res_subtitle);
            status = itemView.findViewById(R.id.res_status);
            actions = itemView.findViewById(R.id.res_actions);
            primary = itemView.findViewById(R.id.res_action_primary);
            secondary = itemView.findViewById(R.id.res_action_secondary);
        }
    }
}
