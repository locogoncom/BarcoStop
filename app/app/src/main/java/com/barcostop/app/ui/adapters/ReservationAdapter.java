package com.barcostop.app.ui.adapters;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
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
import java.util.Locale;

public class ReservationAdapter extends RecyclerView.Adapter<ReservationAdapter.ViewHolder> {
    public interface ReservationActions {
        void onPrimary(Item item);
        void onSecondary(Item item);
        void onTertiary(Item item);
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
        public boolean showTertiary = false;
        public String tertiaryText = "";
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
        String title = item.tripTitle == null || item.tripTitle.trim().isEmpty() ? "-" : item.tripTitle.trim();
        holder.avatar.setText(title.substring(0, 1).toUpperCase(Locale.getDefault()));
        holder.title.setText(title);
        holder.subtitle.setText(item.route);
        holder.status.setText(statusLabel(holder.itemView, item.status));
        applyStatusColor(holder.status, statusColor(item.status));
        renderFeedback(holder.feedback, item.status);

        boolean hasActions = item.showPrimary || item.showSecondary || item.showTertiary;
        holder.actions.setVisibility(hasActions ? View.VISIBLE : View.GONE);
        holder.divider.setVisibility(View.VISIBLE);
        holder.primary.setVisibility(item.showPrimary ? View.VISIBLE : View.GONE);
        holder.secondary.setVisibility(item.showSecondary ? View.VISIBLE : View.GONE);
        holder.tertiary.setVisibility(item.showTertiary ? View.VISIBLE : View.GONE);
        holder.primary.setText(item.primaryText);
        holder.secondary.setText(item.secondaryText);
        holder.tertiary.setText(item.tertiaryText);

        holder.primary.setOnClickListener(v -> actions.onPrimary(item));
        holder.secondary.setOnClickListener(v -> actions.onSecondary(item));
        holder.tertiary.setOnClickListener(v -> actions.onTertiary(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    private static int statusColor(String statusRaw) {
        String status = statusRaw == null ? "" : statusRaw.toLowerCase().trim();
        if (status.equals("approved") || status.equals("confirmed")) return Color.parseColor("#16A34A");
        if (status.equals("rejected") || status.equals("cancelled")) return Color.parseColor("#667085");
        return Color.parseColor("#D97706");
    }

    private static String statusLabel(View root, String statusRaw) {
        String status = statusRaw == null ? "" : statusRaw.toLowerCase().trim();
        if (status.equals("approved")) return "✅ " + root.getContext().getString(R.string.status_chip_approved);
        if (status.equals("confirmed")) return "✅ " + root.getContext().getString(R.string.status_chip_confirmed);
        if (status.equals("rejected")) return "⛔ " + root.getContext().getString(R.string.status_chip_rejected);
        if (status.equals("cancelled")) return "⛔ " + root.getContext().getString(R.string.status_chip_cancelled);
        return "⏳ " + root.getContext().getString(R.string.status_chip_pending);
    }

    private static void applyStatusColor(TextView view, int color) {
        try {
            if (view.getBackground() instanceof GradientDrawable) {
                GradientDrawable bg = (GradientDrawable) view.getBackground().mutate();
                bg.setColor(color);
                return;
            }
        } catch (Throwable ignored) {
        }
        view.setBackgroundColor(color);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView avatar;
        final TextView title;
        final TextView subtitle;
        final TextView status;
        final TextView feedback;
        final View divider;
        final LinearLayout actions;
        final Button primary;
        final Button secondary;
        final Button tertiary;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.res_avatar);
            title = itemView.findViewById(R.id.res_title);
            subtitle = itemView.findViewById(R.id.res_subtitle);
            status = itemView.findViewById(R.id.res_status);
            feedback = itemView.findViewById(R.id.res_feedback);
            divider = itemView.findViewById(R.id.res_divider);
            actions = itemView.findViewById(R.id.res_actions);
            primary = itemView.findViewById(R.id.res_action_primary);
            secondary = itemView.findViewById(R.id.res_action_secondary);
            tertiary = itemView.findViewById(R.id.res_action_tertiary);
        }
    }

    private static void renderFeedback(TextView view, String statusRaw) {
        String status = statusRaw == null ? "" : statusRaw.toLowerCase().trim();
        if (status.equals("rejected")) {
            view.setVisibility(View.VISIBLE);
            view.setText(view.getContext().getString(R.string.reservations_feedback_rejected));
            return;
        }
        if (status.equals("cancelled")) {
            view.setVisibility(View.VISIBLE);
            view.setText(view.getContext().getString(R.string.reservations_feedback_cancelled));
            return;
        }
        view.setVisibility(View.GONE);
    }
}
