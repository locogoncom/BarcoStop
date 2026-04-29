package com.barcostop.app.ui.fragments;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.barcostop.app.BuildConfig;
import com.barcostop.app.R;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class ShareFragment extends Fragment {
    private static final String APP_INTERNAL_TEST_URL = "https://play.google.com/apps/testing/com.barcostop.app";
    private static final String PREFS_NAME = "barcostop_share";
    private static final String KEY_SHARE_COUNT = "share_count";

    private TextView counterView;
    private int shareCount = 0;

    public ShareFragment() {
        super(R.layout.fragment_share);
    }

    @Override
    public void onViewCreated(@NonNull android.view.View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        counterView = view.findViewById(R.id.share_counter);
        Button campaignButton = view.findViewById(R.id.share_btn_campaign);
        Button whatsappButton = view.findViewById(R.id.share_btn_whatsapp);
        Button instagramButton = view.findViewById(R.id.share_btn_instagram);
        Button qrButton = view.findViewById(R.id.share_btn_qr);
        Button donateButton = view.findViewById(R.id.share_btn_donate);

        loadShareCount();

        campaignButton.setOnClickListener(v -> shareCampaignText());
        whatsappButton.setOnClickListener(v -> shareToWhatsApp());
        instagramButton.setOnClickListener(v -> openInstagram());
        qrButton.setOnClickListener(v -> showQrDialog());
        donateButton.setOnClickListener(v -> openPayPalDonation());
    }

    private void loadShareCount() {
        Context context = requireContext();
        shareCount = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getInt(KEY_SHARE_COUNT, 0);
        renderCounter();
    }

    private void renderCounter() {
        if (counterView == null) return;
        counterView.setText(getString(R.string.share_counter_template, shareCount));
    }

    private void incrementShareCount() {
        shareCount += 1;
        requireContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putInt(KEY_SHARE_COUNT, shareCount)
                .apply();
        renderCounter();
    }

    private String buildSharePayload() {
        return getString(R.string.share_payload_template, APP_INTERNAL_TEST_URL);
    }

    private void shareCampaignText() {
        try {
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("text/plain");
            shareIntent.putExtra(Intent.EXTRA_TEXT, buildSharePayload());
            startActivity(Intent.createChooser(shareIntent, getString(R.string.share_btn_campaign)));
            incrementShareCount();
        } catch (Throwable throwable) {
            FeedbackFx.error(requireActivity(), getString(R.string.share_generic_error));
        }
    }

    private void shareToWhatsApp() {
        try {
            String text = URLEncoder.encode(buildSharePayload(), StandardCharsets.UTF_8.toString());
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/?text=" + text));
            startActivity(intent);
            incrementShareCount();
        } catch (Throwable throwable) {
            FeedbackFx.error(requireActivity(), getString(R.string.share_whatsapp_error));
        }
    }

    private void openInstagram() {
        try {
            Intent appIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("instagram://app"));
            startActivity(appIntent);
            incrementShareCount();
            FeedbackFx.info(requireActivity(), getString(R.string.share_instagram_hint));
        } catch (ActivityNotFoundException notFound) {
            try {
                Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.instagram.com/"));
                startActivity(webIntent);
                incrementShareCount();
                FeedbackFx.info(requireActivity(), getString(R.string.share_instagram_hint));
            } catch (Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.share_instagram_error));
            }
        } catch (Throwable throwable) {
            FeedbackFx.error(requireActivity(), getString(R.string.share_instagram_error));
        }
    }

    private void showQrDialog() {
        try {
            Bitmap bitmap = createQrBitmap(APP_INTERNAL_TEST_URL, 560);
            ImageView qrView = new ImageView(requireContext());
            qrView.setImageBitmap(bitmap);
            int pad = dpToPx(12);
            qrView.setPadding(pad, pad, pad, pad);

            new AlertDialog.Builder(requireContext())
                    .setTitle(R.string.share_qr_dialog_title)
                    .setView(qrView)
                    .setMessage(getString(R.string.share_qr_dialog_message, shareCount))
                    .setPositiveButton(R.string.common_close, null)
                    .show();
        } catch (Throwable throwable) {
            FeedbackFx.error(requireActivity(), getString(R.string.share_qr_error));
        }
    }

    private void openPayPalDonation() {
        String url = resolvePayPalDonationUrl();
        if (url.isEmpty()) {
            FeedbackFx.info(requireActivity(), getString(R.string.share_paypal_missing));
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Throwable throwable) {
            FeedbackFx.error(requireActivity(), getString(R.string.share_paypal_error));
        }
    }

    private static String resolvePayPalDonationUrl() {
        String raw = BuildConfig.PAYPAL_ME == null ? "" : BuildConfig.PAYPAL_ME.trim();
        if (raw.isEmpty()) return "";
        if (raw.contains("?")) return raw;
        if (raw.endsWith("/")) raw = raw.substring(0, raw.length() - 1);
        return raw + "/2.5?locale.x=es_ES&country.x=ES";
    }

    private static Bitmap createQrBitmap(String text, int sizePx) throws Exception {
        BitMatrix matrix = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, sizePx, sizePx);
        Bitmap bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        for (int x = 0; x < sizePx; x++) {
            for (int y = 0; y < sizePx; y++) {
                bitmap.setPixel(x, y, matrix.get(x, y) ? Color.BLACK : Color.WHITE);
            }
        }
        return bitmap;
    }

    private int dpToPx(int dp) {
        return (int) (dp * requireContext().getResources().getDisplayMetrics().density);
    }
}
