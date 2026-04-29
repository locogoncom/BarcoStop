package com.barcostop.app.ui.util;

import android.app.Activity;
import android.content.Context;
import android.view.View;
import android.view.inputmethod.InputMethodManager;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

public final class KeyboardUtils {
    private KeyboardUtils() {
    }

    public static void hide(@NonNull Fragment fragment) {
        Activity activity = fragment.getActivity();
        if (activity == null) return;
        View focus = activity.getCurrentFocus();
        if (focus == null) {
            View content = activity.findViewById(android.R.id.content);
            if (content != null) {
                focus = content;
            }
        }
        hide(activity, focus);
    }

    public static void hide(@NonNull Context context, View anchor) {
        if (anchor == null) return;
        try {
            InputMethodManager imm = (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) {
                imm.hideSoftInputFromWindow(anchor.getWindowToken(), 0);
            }
        } catch (Throwable ignored) {
        }
    }
}
