package com.barcostop.app.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;
import com.barcostop.app.core.network.ApiConfig;
import com.barcostop.app.ui.util.RemoteImageLoader;

import java.util.ArrayList;
import java.util.List;

public class TripListAdapter extends RecyclerView.Adapter<TripListAdapter.TripViewHolder> {
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
        holder.title.setText(title);
        holder.route.setText(holder.itemView.getContext().getString(R.string.label_from_to, item.origin, item.destination));
        String meta;
        if ("regatta".equals(item.tripKind)) {
            meta = holder.itemView.getContext().getString(R.string.label_trip_meta_regatta, item.departureDate);
        } else if (item.price == 0 && item.contributionType != null && !item.contributionType.trim().isEmpty()) {
            meta = holder.itemView.getContext().getString(
                    R.string.label_trip_meta_contribution,
                    item.departureDate,
                    item.availableSeats,
                    item.contributionType.trim()
            );
        } else {
            meta = holder.itemView.getContext().getString(R.string.label_trip_meta, item.departureDate, item.availableSeats, item.price);
        }
        holder.meta.setText(meta);
        RemoteImageLoader.load(holder.image, resolveAssetUrl(item.boatImageUrl), R.drawable.bg_input);
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
        final TextView title;
        final TextView route;
        final TextView meta;

        TripViewHolder(@NonNull View itemView) {
            super(itemView);
            image = itemView.findViewById(R.id.tv_trip_image);
            title = itemView.findViewById(R.id.tv_trip_title);
            route = itemView.findViewById(R.id.tv_trip_route);
            meta = itemView.findViewById(R.id.tv_trip_meta);
        }
    }

    private static String resolveAssetUrl(String rawUrl) {
        String url = rawUrl == null ? "" : rawUrl.trim();
        if (url.isEmpty()) return "";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;

        String apiBase = ApiConfig.API_BASE_URL == null ? "" : ApiConfig.API_BASE_URL.trim();
        if (apiBase.isEmpty()) return url;

        String origin = apiBase;
        int apiMarker = origin.indexOf("/api/");
        if (apiMarker > 0) {
            origin = origin.substring(0, apiMarker);
        } else {
            origin = origin.replaceAll("/+$", "");
        }

        if (url.startsWith("/")) {
            return origin + url;
        }
        return origin + "/" + url;
    }
}
