package com.barcostop.app.ui.util;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.LruCache;
import android.view.View;
import android.widget.ImageView;

import androidx.annotation.DrawableRes;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public final class RemoteImageLoader {
    private static final OkHttpClient CLIENT = new OkHttpClient();
    private static final LruCache<String, Bitmap> CACHE = new LruCache<>(64);

    private RemoteImageLoader() {
    }

    public static void load(ImageView target, String url, @DrawableRes int placeholderRes) {
        if (target == null) return;
        String normalized = normalizeUrl(safe(url));
        if (normalized.isEmpty()) {
            target.setVisibility(View.VISIBLE);
            if (placeholderRes != 0) {
                target.setImageResource(placeholderRes);
            }
            return;
        }

        target.setVisibility(View.VISIBLE);
        target.setImageResource(placeholderRes);
        target.setTag(normalized);

        Bitmap cached = CACHE.get(normalized);
        if (cached != null) {
            target.setImageBitmap(cached);
            return;
        }

        new Thread(() -> download(target, normalized)).start();
    }

    private static void download(ImageView target, String url) {
        try {
            Request request = new Request.Builder().url(url).get().build();
            try (Response response = CLIENT.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) return;
                byte[] bytes = response.body().bytes();
                Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (bitmap == null) return;
                CACHE.put(url, bitmap);

                target.post(() -> {
                    Object currentTag = target.getTag();
                    if (currentTag instanceof String && url.equals(currentTag)) {
                        target.setImageBitmap(bitmap);
                    }
                });
            }
        } catch (Throwable ignored) {
        }
    }

    private static String normalizeUrl(String rawUrl) {
        String url = safe(rawUrl);
        if (url.isEmpty()) return "";
        if (!url.startsWith("http://") && !url.startsWith("https://")) return "";
        return url.replace(" ", "%20");
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
