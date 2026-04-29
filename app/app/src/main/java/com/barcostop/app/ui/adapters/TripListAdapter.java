package com.barcostop.app.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;
import com.barcostop.app.core.network.AssetUrlResolver;
import com.barcostop.app.ui.util.RemoteImageLoader;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class TripListAdapter extends RecyclerView.Adapter<TripListAdapter.TripViewHolder> {
    private static final String TRIP_PLACEHOLDER_URL =
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80";

    public interface OnTripClickListener {
        void onTripClick(TripItem item);
    }

    public interface OnTripLongClickListener {
        void onTripLongClick(TripItem item);
    }

    public static class TripItem {
        public String id = "";
        public String title = "";
        public String origin = "";
        public String destination = "";
        public String departureDate = "";
        public int availableSeats = 0;
        public double price = 0;
        public String patronId = "";
        public String tripKind = "trip";
        public String captainNote = "";
        public String contributionType = "";
        public String boatImageUrl = "";
        public String contributionNote = "";
        public String timeWindow = "";
        public String patronName = "";
        public String patronBoatName = "";
    }

    private final List<TripItem> items = new ArrayList<>();
    private final OnTripClickListener listener;
    private final OnTripLongClickListener longClickListener;

    public TripListAdapter(OnTripClickListener listener) {
        this(listener, null);
    }

    public TripListAdapter(OnTripClickListener listener, OnTripLongClickListener longClickListener) {
        this.listener = listener;
        this.longClickListener = longClickListener;
    }

    public void submit(List<TripItem> newItems) {
        items.clear();
        items.addAll(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public TripViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_trip, parent, false);
        return new TripViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull TripViewHolder holder, int position) {
        TripItem item = items.get(position);
        String title = item.title;
        if ("regatta".equals(item.tripKind)) {
            title = "🏁 " + title;
        }
        holder.kindBadge.setVisibility("regatta".equals(item.tripKind) ? View.VISIBLE : View.GONE);
        holder.kindBadge.setText(holder.itemView.getContext().getString(R.string.trip_kind_regatta_badge));
        holder.title.setText(title);
        holder.route.setText("📍 " + holder.itemView.getContext().getString(R.string.label_from_to, item.origin, item.destination));

        String dateLabel = item.departureDate;
        String window = formatWindow(item.timeWindow);
        if (!window.isEmpty()) {
            dateLabel = dateLabel + " · " + window;
        }
        holder.meta.setText("🕒 " + dateLabel);

        String note = safe(item.captainNote);
        if (note.isEmpty() && item.price == 0 && !safe(item.contributionNote).isEmpty()) {
            note = safe(item.contributionNote);
        }
        holder.note.setVisibility(note.isEmpty() ? View.GONE : View.VISIBLE);
        holder.note.setText(note);

        String patronName = safe(item.patronName);
        holder.patron.setVisibility(patronName.isEmpty() ? View.GONE : View.VISIBLE);
        if (!patronName.isEmpty()) {
            holder.patron.setText(holder.itemView.getContext().getString(R.string.trip_card_patron, patronName));
        }
        String boatName = safe(item.patronBoatName);
        holder.boat.setVisibility(boatName.isEmpty() ? View.GONE : View.VISIBLE);
        if (!boatName.isEmpty()) {
            holder.boat.setText(holder.itemView.getContext().getString(R.string.trip_card_boat, boatName));
        }

        holder.seats.setText(holder.itemView.getContext().getString(R.string.trip_card_seats, item.availableSeats));
        if (item.price > 0) {
            holder.price.setText(String.format(Locale.ROOT, "%.2f €", item.price));
        } else if (!safe(item.contributionType).isEmpty()) {
            holder.price.setText(safe(item.contributionType));
        } else {
        holder.price.setText(holder.itemView.getContext().getString(R.string.trip_card_price_free));
        }
        String imageUrl = safe(item.boatImageUrl);
        if (imageUrl.isEmpty()) {
            imageUrl = TRIP_PLACEHOLDER_URL;
        }
        RemoteImageLoader.load(holder.image, AssetUrlResolver.resolve(imageUrl), R.drawable.bg_trip_image_placeholder);
        holder.reserveButton.setOnClickListener(v -> {
            if (listener != null) {
                listener.onTripClick(item);
            }
        });
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onTripClick(item);
            }
        });
        holder.itemView.setOnLongClickListener(v -> {
            if (longClickListener != null) {
                longClickListener.onTripLongClick(item);
                return true;
            }
            return false;
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class TripViewHolder extends RecyclerView.ViewHolder {
        final ImageView image;
        final TextView kindBadge;
        final TextView title;
        final TextView route;
        final TextView meta;
        final TextView note;
        final TextView patron;
        final TextView boat;
        final TextView seats;
        final TextView price;
        final Button reserveButton;

        TripViewHolder(@NonNull View itemView) {
            super(itemView);
            image = itemView.findViewById(R.id.tv_trip_image);
            kindBadge = itemView.findViewById(R.id.tv_trip_kind_badge);
            title = itemView.findViewById(R.id.tv_trip_title);
            route = itemView.findViewById(R.id.tv_trip_route);
            meta = itemView.findViewById(R.id.tv_trip_date_meta);
            note = itemView.findViewById(R.id.tv_trip_note);
            patron = itemView.findViewById(R.id.tv_trip_patron);
            boat = itemView.findViewById(R.id.tv_trip_boat);
            seats = itemView.findViewById(R.id.tv_trip_seats);
            price = itemView.findViewById(R.id.tv_trip_price);
            reserveButton = itemView.findViewById(R.id.tv_trip_reserve_button);
        }
    }

    private static String formatWindow(String value) {
        String normalized = safe(value).toLowerCase(Locale.ROOT);
        if ("morning".equals(normalized)) return "manana";
        if ("afternoon".equals(normalized)) return "tarde";
        if ("night".equals(normalized)) return "noche";
        return "";
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
