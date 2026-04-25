package com.barcostop.app.ui.feedback;

import android.app.Activity;
import android.graphics.Color;
import android.view.View;
import android.widget.TextView;

import androidx.annotation.StringRes;

import com.google.android.material.snackbar.Snackbar;

public final class FeedbackFx {
    private FeedbackFx() {
    }

    public static void success(Activity activity, CharSequence message) {
        show(activity, "✓ " + message, Color.parseColor("#166534"), Color.WHITE);
    }

    public static void error(Activity activity, CharSequence message) {
        show(activity, "✕ " + message, Color.parseColor("#991B1B"), Color.WHITE);
    }

    public static void info(Activity activity, CharSequence message) {
        show(activity, message, Color.parseColor("#0E7490"), Color.WHITE);
    }

    public static void info(Activity activity, @StringRes int messageRes) {
        show(activity, activity.getString(messageRes), Color.parseColor("#0E7490"), Color.WHITE);
    }

    private static void show(Activity activity, CharSequence message, int backgroundColor, int textColor) {
        if (activity == null) return;
        View root = activity.findViewById(android.R.id.content);
        if (root == null) return;

        Snackbar snackbar = Snackbar.make(root, message, Snackbar.LENGTH_LONG);
        snackbar.setBackgroundTint(backgroundColor);
        snackbar.setTextColor(textColor);
        snackbar.setAnimationMode(Snackbar.ANIMATION_MODE_FADE);

        TextView textView = snackbar.getView().findViewById(com.google.android.material.R.id.snackbar_text);
        if (textView != null) {
            textView.setMaxLines(4);
        }

        snackbar.show();
    }
}
