package com.barcostop.app.ui.fragments;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.BoatActions;
import com.barcostop.app.core.actions.BookingActions;
import com.barcostop.app.core.actions.DonationActions;
import com.barcostop.app.core.actions.RatingActions;
import com.barcostop.app.core.actions.SupportActions;
import com.barcostop.app.core.actions.TripActions;
import com.barcostop.app.core.actions.UserActions;
import com.barcostop.app.core.network.ApiConfig;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.ProfileTripAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;
import com.barcostop.app.ui.screens.HomeActivity;
import com.barcostop.app.ui.screens.MainAppActivity;
import com.barcostop.app.ui.util.KeyboardUtils;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class ProfileFragment extends Fragment {
    private UserActions userActions;
    private BoatActions boatActions;
    private TripActions tripActions;
    private BookingActions bookingActions;
    private RatingActions ratingActions;
    private DonationActions donationActions;
    private SupportActions supportActions;
    private SessionStore sessionStore;

    private TextView emailView;
    private TextView roleView;
    private EditText nameInput;
    private EditText bioInput;
    private EditText currentLocationInput;
    private EditText instagramInput;
    private EditText phoneInput;
    private EditText languagesInput;
    private EditText sailingExperienceInput;
    private EditText certificationsInput;
    private EditText preferredRoutesInput;
    private EditText skillsGeneralInput;
    private EditText cleaningLevelInput;
    private EditText boatNameInput;
    private EditText boatTypeInput;
    private EditText boatDetailsInput;
    private EditText boatModelInput;
    private EditText boatLengthInput;
    private EditText homePortInput;
    private EditText captainLicenseInput;
    private EditText boatCapacityInput;
    private EditText boatYearInput;
    private EditText boatLicenseInput;
    private EditText boatPhoto1Input;
    private EditText boatPhoto2Input;
    private EditText boatPhoto3Input;
    private EditText supportInput;
    private ImageView avatarPreview;
    private TextView avatarHintView;
    private TextView travelerSectionTitle;
    private TextView captainSectionTitle;
    private TextView myTripsEmptyView;
    private TextView ratingSummaryView;
    private TextView donationSummaryView;
    private TextView supportEmptyView;
    private LinearLayout supportListView;
    private ProfileTripAdapter myTripsAdapter;
    private RecyclerView myTripsRecycler;
    private ProgressBar loadingView;
    private ActivityResultLauncher<String> avatarPicker;
    private String currentRole = HomeActivity.ROLE_VIAJERO;
    private String currentBoatId = "";

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        BarcoStopApplication app = (BarcoStopApplication) requireActivity().getApplication();
        userActions = new UserActions(app.getApiClient());
        boatActions = new BoatActions(app.getApiClient());
        tripActions = new TripActions(app.getApiClient());
        bookingActions = new BookingActions(app.getApiClient());
        ratingActions = new RatingActions(app.getApiClient());
        donationActions = new DonationActions(app.getApiClient());
        supportActions = new SupportActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        emailView = view.findViewById(R.id.profile_email);
        roleView = view.findViewById(R.id.profile_role);
        nameInput = view.findViewById(R.id.profile_name_input);
        bioInput = view.findViewById(R.id.profile_bio_input);
        currentLocationInput = view.findViewById(R.id.profile_current_location_input);
        instagramInput = view.findViewById(R.id.profile_instagram_input);
        phoneInput = view.findViewById(R.id.profile_phone_input);
        languagesInput = view.findViewById(R.id.profile_languages_input);
        sailingExperienceInput = view.findViewById(R.id.profile_sailing_experience_input);
        certificationsInput = view.findViewById(R.id.profile_certifications_input);
        preferredRoutesInput = view.findViewById(R.id.profile_preferred_routes_input);
        skillsGeneralInput = view.findViewById(R.id.profile_skills_general_input);
        cleaningLevelInput = view.findViewById(R.id.profile_cleaning_level_input);
        boatNameInput = view.findViewById(R.id.profile_boat_name_input);
        boatTypeInput = view.findViewById(R.id.profile_boat_type_input);
        boatDetailsInput = view.findViewById(R.id.profile_boat_details_input);
        boatModelInput = view.findViewById(R.id.profile_boat_model_input);
        boatLengthInput = view.findViewById(R.id.profile_boat_length_input);
        homePortInput = view.findViewById(R.id.profile_home_port_input);
        captainLicenseInput = view.findViewById(R.id.profile_captain_license_input);
        boatCapacityInput = view.findViewById(R.id.profile_boat_capacity_input);
        boatYearInput = view.findViewById(R.id.profile_boat_year_input);
        boatLicenseInput = view.findViewById(R.id.profile_boat_license_input);
        boatPhoto1Input = view.findViewById(R.id.profile_boat_photo_1_input);
        boatPhoto2Input = view.findViewById(R.id.profile_boat_photo_2_input);
        boatPhoto3Input = view.findViewById(R.id.profile_boat_photo_3_input);
        supportInput = view.findViewById(R.id.profile_support_input);
        avatarPreview = view.findViewById(R.id.profile_avatar_preview);
        avatarHintView = view.findViewById(R.id.profile_avatar_hint);
        travelerSectionTitle = view.findViewById(R.id.profile_traveler_section_title);
        captainSectionTitle = view.findViewById(R.id.profile_captain_section_title);
        myTripsEmptyView = view.findViewById(R.id.profile_my_trips_empty);
        myTripsRecycler = view.findViewById(R.id.profile_my_trips_recycler);
        ratingSummaryView = view.findViewById(R.id.profile_rating_summary);
        donationSummaryView = view.findViewById(R.id.profile_donation_summary);
        supportEmptyView = view.findViewById(R.id.profile_support_empty);
        supportListView = view.findViewById(R.id.profile_support_list);
        loadingView = view.findViewById(R.id.profile_loading);

        myTripsRecycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        myTripsAdapter = new ProfileTripAdapter(item -> shareTrip(item.shareText));
        myTripsRecycler.setAdapter(myTripsAdapter);

        Button saveButton = view.findViewById(R.id.profile_save_button);
        Button donateButton = view.findViewById(R.id.profile_donate_button);
        Button supportSendButton = view.findViewById(R.id.profile_support_send);
        Button avatarPickButton = view.findViewById(R.id.profile_avatar_pick);

        avatarPicker = registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
            if (uri == null) return;
            avatarPreview.setImageURI(uri);
            avatarHintView.setText(uri.toString());
            String userId = safe(sessionStore.getUserId());
            if (!userId.isEmpty()) {
                uploadAvatar(userId, uri);
            }
        });

        saveButton.setOnClickListener(v -> {
            KeyboardUtils.hide(ProfileFragment.this);
            saveProfile();
        });
        donateButton.setOnClickListener(v -> registerFixedDonation());
        supportSendButton.setOnClickListener(v -> {
            KeyboardUtils.hide(ProfileFragment.this);
            sendSupportMessage();
        });
        avatarPickButton.setOnClickListener(v -> avatarPicker.launch("image/*"));

        bindRoleSections();
        loadProfile();
    }

    private void loadProfile() {
        String userId = sessionStore.getUserId();
        if (userId == null || userId.trim().isEmpty()) {
            return;
        }

        loadingView.setVisibility(View.VISIBLE);
        userActions.getUserById(userId, new UiApiCallback(ProfileFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                loadingView.setVisibility(View.GONE);
                try {
                    JSONObject user = new JSONObject(body);
                    String email = readFirst(user, "email");
                    String role = normalizeRole(readFirst(user, "role"));
                    String name = readFirst(user, "name", "username");
                    String bio = readFirst(user, "bio");
                    currentRole = role;
                    bindRoleSections();

                    emailView.setText(email);
                    roleView.setText(role.equals(HomeActivity.ROLE_PATRON)
                            ? getString(R.string.role_captain)
                            : getString(R.string.role_traveler));
                    nameInput.setText(name);
                    bioInput.setText(bio);
                    currentLocationInput.setText(readFirst(user, "currentLocation", "current_location"));
                    instagramInput.setText(readFirst(user, "instagram"));
                    phoneInput.setText(readFirst(user, "phone"));
                    languagesInput.setText(readFirst(user, "languages"));
                    avatarHintView.setText(nonEmpty(readFirst(user, "avatar"), getString(R.string.profile_avatar_none)));
                    sailingExperienceInput.setText(readFirst(user, "sailingExperience", "sailing_experience"));
                    certificationsInput.setText(readFirst(user, "certifications"));
                    preferredRoutesInput.setText(readFirst(user, "preferredRoutes", "preferred_routes"));
                    skillsGeneralInput.setText(readFirst(user, "skillsGeneral", "skills_general"));
                    cleaningLevelInput.setText(readFirst(user, "cleaningLevel", "cleaning_level"));
                    boatNameInput.setText(readFirst(user, "boatName", "boat_name"));
                    boatTypeInput.setText(readFirst(user, "boatType", "boat_type"));
                    boatDetailsInput.setText(readFirst(user, "boatDetails", "boat_details"));
                    boatModelInput.setText(readFirst(user, "boatModel", "boat_model"));
                    boatLengthInput.setText(readFirst(user, "boatLengthM", "boat_length_m"));
                    homePortInput.setText(readFirst(user, "homePort", "home_port"));
                    captainLicenseInput.setText(readFirst(user, "captainLicense", "captain_license"));
                    boatCapacityInput.setText(readFirst(user, "boatCapacity", "boat_capacity"));
                    boatYearInput.setText(readFirst(user, "boatYear", "boat_year"));
                    boatLicenseInput.setText(readFirst(user, "boatLicense", "boat_license"));
                    boatPhoto1Input.setText(readFirst(user, "boatPhoto1", "boat_photo_1"));
                    boatPhoto2Input.setText(readFirst(user, "boatPhoto2", "boat_photo_2"));
                    boatPhoto3Input.setText(readFirst(user, "boatPhoto3", "boat_photo_3"));
                    if (HomeActivity.ROLE_PATRON.equals(currentRole)) {
                        loadCaptainBoat(userId);
                    }
                    loadMyTrips();
                    loadRatings(userId);
                    loadDonationSummary(userId);
                    loadSupportMessages(userId);
                } catch (Throwable throwable) {
                    FeedbackFx.error(requireActivity(), getString(R.string.profile_load_error));
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                loadingView.setVisibility(View.GONE);
                if (throwable != null && throwable.getMessage() != null && throwable.getMessage().startsWith("JWT_")) {
                    if (requireActivity() instanceof MainAppActivity) {
                        ((MainAppActivity) requireActivity()).forceLogoutToHome();
                        return;
                    }
                }
                FeedbackFx.error(requireActivity(), getString(R.string.profile_load_error));
            }
        });
    }

    private void saveProfile() {
        String userId = sessionStore.getUserId();
        if (userId == null || userId.trim().isEmpty()) return;

        loadingView.setVisibility(View.VISIBLE);
        try {
            JSONObject payload = new JSONObject();
            payload.put("name", text(nameInput));
            payload.put("bio", text(bioInput));
            payload.put("currentLocation", text(currentLocationInput));
            payload.put("instagram", text(instagramInput));
            payload.put("phone", text(phoneInput));
            payload.put("languages", text(languagesInput));
            payload.put("sailingExperience", text(sailingExperienceInput));
            payload.put("certifications", text(certificationsInput));
            payload.put("preferredRoutes", text(preferredRoutesInput));
            payload.put("skillsGeneral", text(skillsGeneralInput));
            payload.put("cleaningLevel", text(cleaningLevelInput));
            payload.put("boatDetails", text(boatDetailsInput));
            if (!HomeActivity.ROLE_PATRON.equals(currentRole)) {
                payload.put("boatName", "");
                payload.put("boatType", "");
                payload.put("boatDetails", "");
            }

            userActions.updateUser(userId, payload.toString(), new UiApiCallback(ProfileFragment.this) {
                @Override
                public void onUiSuccess(String body) {
                    if (HomeActivity.ROLE_PATRON.equals(currentRole)) {
                        saveCaptainBoat(userId);
                        return;
                    }
                    loadingView.setVisibility(View.GONE);
                    FeedbackFx.success(requireActivity(), getString(R.string.profile_saved));
                }

                @Override
                public void onUiError(Throwable throwable) {
                    loadingView.setVisibility(View.GONE);
                    FeedbackFx.error(requireActivity(), getString(R.string.profile_save_error));
                }
            });
        } catch (Throwable throwable) {
            loadingView.setVisibility(View.GONE);
            FeedbackFx.error(requireActivity(), getString(R.string.profile_save_error));
        }
    }

    private void loadRatings(String userId) {
        ratingActions.listRatingsByUser(userId, new UiApiCallback(ProfileFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject json = new JSONObject(body);
                    double avg = json.optDouble("averageRating", 0);
                    int reviewCount = json.optInt("reviewCount", 0);
                    ratingSummaryView.setText(getString(R.string.profile_rating_summary_value, avg, reviewCount));
                } catch (Throwable throwable) {
                    ratingSummaryView.setText(getString(R.string.profile_rating_summary_placeholder));
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                ratingSummaryView.setText(getString(R.string.profile_rating_summary_placeholder));
            }
        });
    }

    private void loadDonationSummary(String userId) {
        donationActions.getDonationsByUser(userId, new UiApiCallback(ProfileFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONObject json = new JSONObject(body);
                    int count = json.optInt("count", 0);
                    double total = json.optDouble("total", 0);
                    donationSummaryView.setText(getString(R.string.profile_donation_summary_value, count, total));
                } catch (Throwable throwable) {
                    donationSummaryView.setText(getString(R.string.profile_donation_summary_placeholder));
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                donationSummaryView.setText(getString(R.string.profile_donation_summary_placeholder));
            }
        });
    }

    private void registerFixedDonation() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) return;

        try {
            JSONObject payload = new JSONObject();
            payload.put("userId", userId);
            payload.put("amount", 2.5);

            donationActions.createDonation(payload.toString(), new UiApiCallback(ProfileFragment.this) {
                @Override
                public void onUiSuccess(String body) {
                    FeedbackFx.success(requireActivity(), getString(R.string.profile_donate_success));
                    loadDonationSummary(userId);
                }

                @Override
                public void onUiError(Throwable throwable) {
                    FeedbackFx.error(requireActivity(), extractApiError(throwable, getString(R.string.profile_donate_error)));
                }
            });
        } catch (Throwable throwable) {
            FeedbackFx.error(requireActivity(), getString(R.string.profile_donate_error));
        }
    }

    private void sendSupportMessage() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) return;

        String message = text(supportInput);
        if (message.isEmpty()) {
            FeedbackFx.info(requireActivity(), getString(R.string.profile_support_hint));
            return;
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("userId", userId);
            payload.put("message", message);

            supportActions.createSupportMessage(payload.toString(), new UiApiCallback(ProfileFragment.this) {
                @Override
                public void onUiSuccess(String body) {
                    supportInput.setText("");
                    FeedbackFx.success(requireActivity(), getString(R.string.profile_support_sent));
                    loadSupportMessages(userId);
                }

                @Override
                public void onUiError(Throwable throwable) {
                    FeedbackFx.error(requireActivity(), extractApiError(throwable, getString(R.string.profile_support_send_error)));
                }
            });
        } catch (Throwable throwable) {
            FeedbackFx.error(requireActivity(), getString(R.string.profile_support_send_error));
        }
    }

    private void loadSupportMessages(String userId) {
        supportActions.listSupportMessages(userId, new UiApiCallback(ProfileFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONArray items = new JSONArray(body);
                    renderSupportMessages(items);
                } catch (Throwable throwable) {
                    supportListView.removeAllViews();
                    supportEmptyView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
                String msg = throwable == null ? "" : safe(throwable.getMessage()).toLowerCase(Locale.ROOT);
                if (msg.contains("http 404")) {
                    supportListView.removeAllViews();
                    supportEmptyView.setVisibility(View.VISIBLE);
                    return;
                }
                FeedbackFx.error(requireActivity(), getString(R.string.profile_support_load_error));
            }
        });
    }

    private void renderSupportMessages(JSONArray items) {
        supportListView.removeAllViews();
        int count = items == null ? 0 : items.length();
        supportEmptyView.setVisibility(count == 0 ? View.VISIBLE : View.GONE);

        String userId = safe(sessionStore.getUserId());
        for (int i = 0; i < count; i++) {
            JSONObject row = items.optJSONObject(i);
            if (row == null) continue;

            String id = readFirst(row, "id");
            String status = readFirst(row, "status");
            String message = readFirst(row, "message");
            String date = formatSupportDate(readFirst(row, "createdAt", "created_at"));

            LinearLayout rowView = new LinearLayout(requireContext());
            rowView.setOrientation(LinearLayout.HORIZONTAL);
            rowView.setGravity(android.view.Gravity.CENTER_VERTICAL);
            rowView.setPadding(0, 6, 0, 6);

            TextView line = new TextView(requireContext());
            line.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
            line.setText(getString(R.string.profile_support_item, nonEmpty(message, "-"), nonEmpty(status, date)));
            line.setTextColor(requireContext().getColor(R.color.bs_text));

            Button deleteBtn = new Button(requireContext());
            deleteBtn.setText("✕");
            deleteBtn.setMinWidth(0);
            deleteBtn.setMinimumWidth(0);
            deleteBtn.setPadding(16, 6, 16, 6);
            deleteBtn.setAllCaps(false);
            deleteBtn.setOnClickListener(v -> deleteSupportMessage(id, userId));

            rowView.addView(line);
            rowView.addView(deleteBtn);
            supportListView.addView(rowView);
        }
    }

    private void deleteSupportMessage(String messageId, String userId) {
        if (safe(messageId).isEmpty() || safe(userId).isEmpty()) return;
        supportActions.deleteSupportMessage(messageId, new UiApiCallback(ProfileFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(requireActivity(), getString(R.string.profile_support_deleted));
                loadSupportMessages(userId);
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(requireActivity(), getString(R.string.profile_support_delete_error));
            }
        });
    }

    private String formatSupportDate(String raw) {
        String value = safe(raw);
        if (value.isEmpty()) return getString(R.string.profile_unknown_date);

        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US);
            Date date = input.parse(value.replace('T', ' ').replace("Z", ""));
            if (date == null) return value;
            SimpleDateFormat output = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault());
            return output.format(date);
        } catch (ParseException ignored) {
            return value;
        }
    }

    private void uploadAvatar(String userId, Uri uri) {
        String token = safe(sessionStore.getToken());
        if (token.isEmpty()) {
            FeedbackFx.error(requireActivity(), getString(R.string.profile_avatar_upload_error));
            return;
        }

        new Thread(() -> {
            try {
                byte[] bytes;
                try (java.io.InputStream input = requireContext().getContentResolver().openInputStream(uri)) {
                    if (input == null) throw new IllegalStateException("No image stream");
                    bytes = input.readAllBytes();
                }

                if (bytes.length > 5 * 1024 * 1024) {
                    requireActivity().runOnUiThread(() ->
                            FeedbackFx.info(requireActivity(), getString(R.string.profile_avatar_too_large))
                    );
                    return;
                }

                String mime = safe(requireContext().getContentResolver().getType(uri));
                if (mime.isEmpty()) mime = "image/jpeg";
                String extension = mime.endsWith("png") ? ".png" : ".jpg";
                String fileName = "avatar" + extension;

                RequestBody fileBody = RequestBody.create(bytes, MediaType.parse(mime));
                MultipartBody body = new MultipartBody.Builder()
                        .setType(MultipartBody.FORM)
                        .addFormDataPart("avatar", fileName, fileBody)
                        .build();

                String base = ApiConfig.API_BASE_URL.endsWith("/")
                        ? ApiConfig.API_BASE_URL
                        : ApiConfig.API_BASE_URL + "/";
                String url = base + "users/" + userId + "/avatar";

                Request request = new Request.Builder()
                        .url(url)
                        .addHeader("Authorization", "Bearer " + token)
                        .post(body)
                        .build();

                OkHttpClient client = new OkHttpClient.Builder().build();
                try (Response response = client.newCall(request).execute()) {
                    String responseBody = response.body() != null ? response.body().string() : "";
                    if (!response.isSuccessful()) {
                        String error = parseErrorBody(responseBody, getString(R.string.profile_avatar_upload_error));
                        requireActivity().runOnUiThread(() -> FeedbackFx.error(requireActivity(), error));
                        return;
                    }

                    String avatarPath = extractAvatarPath(responseBody);
                    requireActivity().runOnUiThread(() -> {
                        avatarHintView.setText(nonEmpty(avatarPath, getString(R.string.profile_avatar_none)));
                        FeedbackFx.success(requireActivity(), getString(R.string.profile_avatar_upload_ok));
                    });
                }
            } catch (Throwable throwable) {
                requireActivity().runOnUiThread(() ->
                        FeedbackFx.error(requireActivity(), getString(R.string.profile_avatar_upload_error))
                );
            }
        }).start();
    }

    private static String extractAvatarPath(String body) {
        try {
            JSONObject json = new JSONObject(body);
            String avatar = json.optString("avatar", "").trim();
            if (!avatar.isEmpty()) return avatar;
            JSONObject user = json.optJSONObject("user");
            if (user == null) return "";
            return user.optString("avatar", "").trim();
        } catch (Throwable ignored) {
            return "";
        }
    }

    private static String parseErrorBody(String body, String fallback) {
        try {
            JSONObject json = new JSONObject(body);
            String err = json.optString("error", "").trim();
            return err.isEmpty() ? fallback : err;
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private static String text(EditText editText) {
        return editText.getText() == null ? "" : editText.getText().toString().trim();
    }

    private static String readFirst(JSONObject obj, String... keys) {
        for (String key : keys) {
            String value = obj.optString(key, "");
            if (value == null) continue;
            String clean = value.trim();
            if (clean.isEmpty() || "null".equalsIgnoreCase(clean)) continue;
            return clean;
        }
        return "";
    }

    private static String normalizeRole(String role) {
        String value = role == null ? "" : role.trim().toLowerCase(Locale.ROOT);
        if (value.equals("patron") || value.equals("captain") || value.equals("capitan") || value.equals("patrón")) {
            return HomeActivity.ROLE_PATRON;
        }
        return HomeActivity.ROLE_VIAJERO;
    }

    private void bindRoleSections() {
        boolean isCaptain = HomeActivity.ROLE_PATRON.equals(currentRole);
        setVisible(captainSectionTitle, isCaptain);
        setVisible(boatNameInput, isCaptain);
        setVisible(boatTypeInput, isCaptain);
        setVisible(boatDetailsInput, isCaptain);
        setVisible(boatModelInput, isCaptain);
        setVisible(boatLengthInput, isCaptain);
        setVisible(homePortInput, isCaptain);
        setVisible(captainLicenseInput, isCaptain);
        setVisible(boatCapacityInput, isCaptain);
        setVisible(boatYearInput, isCaptain);
        setVisible(boatLicenseInput, isCaptain);
        setVisible(boatPhoto1Input, isCaptain);
        setVisible(boatPhoto2Input, isCaptain);
        setVisible(boatPhoto3Input, isCaptain);

        setVisible(travelerSectionTitle, !isCaptain);
        setVisible(sailingExperienceInput, !isCaptain);
        setVisible(certificationsInput, !isCaptain);
        setVisible(preferredRoutesInput, !isCaptain);
        setVisible(skillsGeneralInput, !isCaptain);
        setVisible(cleaningLevelInput, !isCaptain);
    }

    private static void setVisible(View view, boolean visible) {
        view.setVisibility(visible ? View.VISIBLE : View.GONE);
    }

    private void loadMyTrips() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            myTripsAdapter.submit(new ArrayList<>());
            myTripsEmptyView.setVisibility(View.VISIBLE);
            return;
        }

        if (HomeActivity.ROLE_PATRON.equals(currentRole)) {
            loadCaptainTrips(userId);
            return;
        }
        loadTravelerTrips(userId);
    }

    private void loadCaptainTrips(String userId) {
        tripActions.listTrips(new UiApiCallback(ProfileFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                List<ProfileTripAdapter.Item> items = new ArrayList<>();
                try {
                    JSONArray arr = new JSONArray(body);
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject trip = arr.optJSONObject(i);
                        if (trip == null) continue;
                        String patronId = readFirst(trip, "patronId", "patron_id");
                        if (!userId.equals(patronId)) continue;
                        items.add(mapTripItem(trip, false));
                    }
                } catch (Throwable ignored) {
                }
                renderMyTrips(items);
            }

            @Override
            public void onUiError(Throwable throwable) {
                renderMyTrips(new ArrayList<>());
            }
        });
    }

    private void loadTravelerTrips(String userId) {
        bookingActions.listReservationsByUser(userId, new UiApiCallback(ProfileFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                Set<String> reservedTripIds = new HashSet<>();
                try {
                    JSONArray arr = new JSONArray(body);
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject row = arr.optJSONObject(i);
                        if (row == null) continue;
                        String status = readFirst(row, "status");
                        if (status.equalsIgnoreCase("rejected") || status.equalsIgnoreCase("cancelled")) continue;
                        String tripId = readFirst(row, "tripId", "trip_id");
                        if (!tripId.isEmpty()) reservedTripIds.add(tripId);
                    }
                } catch (Throwable ignored) {
                }

                tripActions.listTrips(new UiApiCallback(ProfileFragment.this) {
                    @Override
                    public void onUiSuccess(String tripsBody) {
                        List<ProfileTripAdapter.Item> items = new ArrayList<>();
                        try {
                            JSONArray arr = new JSONArray(tripsBody);
                            for (int i = 0; i < arr.length(); i++) {
                                JSONObject trip = arr.optJSONObject(i);
                                if (trip == null) continue;
                                String tripId = readFirst(trip, "id");
                                if (!reservedTripIds.contains(tripId)) continue;
                                items.add(mapTripItem(trip, true));
                            }
                        } catch (Throwable ignored) {
                        }
                        renderMyTrips(items);
                    }

                    @Override
                    public void onUiError(Throwable throwable) {
                        renderMyTrips(new ArrayList<>());
                    }
                });
            }

            @Override
            public void onUiError(Throwable throwable) {
                renderMyTrips(new ArrayList<>());
            }
        });
    }

    private ProfileTripAdapter.Item mapTripItem(JSONObject trip, boolean travelerMode) {
        ProfileTripAdapter.Item item = new ProfileTripAdapter.Item();
        item.tripId = readFirst(trip, "id");
        String origin = readFirst(trip, "origin");
        String destination = readFirst(trip, "destination");
        String date = readFirst(trip, "departureDate", "departure_date");
        String time = readFirst(trip, "departureTime", "departure_time");
        String seats = readFirst(trip, "availableSeats", "available_seats");
        String price = readFirst(trip, "cost", "price");
        String left = origin.isEmpty() ? getString(R.string.profile_trip_fallback) : origin;
        String right = destination.isEmpty() ? getString(R.string.trip_detail_value_undefined) : destination;
        String when = (date + " " + time).trim();
        if (when.isEmpty()) when = getString(R.string.trip_detail_value_undefined);
        String seatsLabel = seats.isEmpty() ? "?" : seats;
        String priceLabel = price.isEmpty() || "0".equals(price) || "0.0".equals(price) || "0.00".equals(price)
                ? getString(R.string.trip_card_price_free)
                : (price + " EUR");
        item.title = left + " → " + right;
        item.subtitle = (travelerMode ? getString(R.string.profile_trip_reserved) : getString(R.string.profile_trip_owned))
                + " · " + when + " · " + getString(R.string.trip_detail_seats_label) + ": " + seatsLabel
                + " · " + getString(R.string.trip_detail_price_label) + ": " + priceLabel;
        item.shareText = getString(
                R.string.profile_share_trip_template,
                item.title,
                date,
                price
        );
        return item;
    }

    private void renderMyTrips(List<ProfileTripAdapter.Item> items) {
        myTripsAdapter.submit(items);
        myTripsEmptyView.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
    }

    private void shareTrip(String shareText) {
        String text = shareText == null ? "" : shareText.trim();
        if (text.isEmpty()) return;
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, text);
        startActivity(Intent.createChooser(intent, getString(R.string.profile_share_trip)));
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private void loadCaptainBoat(String userId) {
        boatActions.listBoatsByPatron(userId, new UiApiCallback(ProfileFragment.this) {
            @Override
            public void onUiSuccess(String body) {
                try {
                    JSONArray boats = new JSONArray(body);
                    if (boats.length() == 0) return;
                    JSONObject boat = boats.optJSONObject(0);
                    if (boat == null) return;
                    currentBoatId = readFirst(boat, "id");
                    String description = readFirst(boat, "description");
                    JSONObject meta = parseBoatMeta(description);

                    boatNameInput.setText(readFirst(boat, "name"));
                    boatTypeInput.setText(readFirst(boat, "type"));
                    boatDetailsInput.setText(readFirst(meta, "boatDetails"));
                    String boatModel = readFirst(meta, "boatModel");
                    boatModelInput.setText(boatModel.isEmpty() ? readFirst(boat, "fuelType") : boatModel);
                    boatLengthInput.setText(readFirst(boat, "length"));
                    homePortInput.setText(readFirst(meta, "homePort"));
                    captainLicenseInput.setText(readFirst(meta, "captainLicense"));
                    boatCapacityInput.setText(readFirst(boat, "capacity"));
                    boatYearInput.setText(readFirst(boat, "yearBuilt"));
                    boatLicenseInput.setText(readFirst(boat, "licenseNumber"));

                    boatPhoto1Input.setText(readFirst(meta, "photo1"));
                    boatPhoto2Input.setText(readFirst(meta, "photo2"));
                    boatPhoto3Input.setText(readFirst(meta, "photo3"));
                } catch (Throwable ignored) {
                }
            }

            @Override
            public void onUiError(Throwable throwable) {
            }
        });
    }

    private void saveCaptainBoat(String userId) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("actorId", userId);
            payload.put("patronId", userId);
            payload.put("name", nonEmpty(text(boatNameInput), getString(R.string.profile_boat_default_name)));
            payload.put("type", nonEmpty(text(boatTypeInput), getString(R.string.profile_boat_default_type)));
            payload.put("capacity", parseInt(text(boatCapacityInput), 1));
            payload.put("length", parseDouble(text(boatLengthInput), 0));
            payload.put("yearBuilt", parseInt(text(boatYearInput), 0));
            payload.put("fuelType", text(boatModelInput));
            payload.put("licenseNumber", text(boatLicenseInput));
            payload.put("status", "active");
            payload.put("description", buildBoatDescriptionWithMeta());
            payload.put("safetyEquipment", new JSONArray());

            UiApiCallback callback = new UiApiCallback(ProfileFragment.this) {
                @Override
                public void onUiSuccess(String body) {
                    loadingView.setVisibility(View.GONE);
                    FeedbackFx.success(requireActivity(), getString(R.string.profile_saved));
                    loadCaptainBoat(userId);
                }

                @Override
                public void onUiError(Throwable throwable) {
                    loadingView.setVisibility(View.GONE);
                    FeedbackFx.error(requireActivity(), getString(R.string.profile_saved_boat_error));
                }
            };

            if (currentBoatId.isEmpty()) {
                boatActions.createBoat(payload.toString(), callback);
            } else {
                boatActions.updateBoat(currentBoatId, payload.toString(), callback);
            }
        } catch (Throwable throwable) {
            loadingView.setVisibility(View.GONE);
            FeedbackFx.error(requireActivity(), getString(R.string.profile_saved_boat_error));
        }
    }

    private String buildBoatDescriptionWithMeta() {
        try {
            JSONObject meta = new JSONObject();
            meta.put("boatModel", text(boatModelInput));
            meta.put("boatDetails", text(boatDetailsInput));
            meta.put("homePort", text(homePortInput));
            meta.put("captainLicense", text(captainLicenseInput));
            meta.put("photo1", text(boatPhoto1Input));
            meta.put("photo2", text(boatPhoto2Input));
            meta.put("photo3", text(boatPhoto3Input));

            return getString(R.string.profile_boat_description_prefix) + "\n[BSBOATMETA]" + meta.toString();
        } catch (Throwable ignored) {
            return getString(R.string.profile_boat_description_prefix);
        }
    }

    private static JSONObject parseBoatMeta(String description) {
        JSONObject out = new JSONObject();
        try {
            if (description == null) return out;
            int marker = description.indexOf("\n[BSBOATMETA]");
            if (marker < 0) return out;
            String raw = description.substring(marker + "\n[BSBOATMETA]".length()).trim();
            return new JSONObject(raw);
        } catch (Throwable ignored) {
            return out;
        }
    }

    private static String nonEmpty(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private static double parseDouble(String value, double fallback) {
        try {
            return Double.parseDouble(value);
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private String extractApiError(Throwable throwable, String fallback) {
        String msg = throwable == null ? "" : safe(throwable.getMessage());
        if (msg.isEmpty()) return fallback;
        int sep = msg.indexOf(" - ");
        if (sep < 0 || sep + 3 >= msg.length()) return fallback;
        String body = msg.substring(sep + 3).trim();

        try {
            JSONObject parsed = new JSONObject(body);
            String error = parsed.optString("error", "").trim();
            return error.isEmpty() ? fallback : error;
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private abstract static class UiApiCallback implements com.barcostop.app.core.network.ApiCallback {
        private final androidx.fragment.app.Fragment fragment;

        UiApiCallback(androidx.fragment.app.Fragment fragment) {
            this.fragment = fragment;
        }

        @Override
        public final void onSuccess(String body) {
            android.app.Activity activity = fragment.getActivity();
            if (activity == null || !fragment.isAdded() || activity.isFinishing() || activity.isDestroyed()) {
                return;
            }
            activity.runOnUiThread(() -> {
                if (!fragment.isAdded()) return;
                onUiSuccess(body);
            });
        }

        @Override
        public final void onError(Throwable throwable) {
            android.app.Activity activity = fragment.getActivity();
            if (activity == null || !fragment.isAdded() || activity.isFinishing() || activity.isDestroyed()) {
                return;
            }
            activity.runOnUiThread(() -> {
                if (!fragment.isAdded()) return;
                onUiError(throwable);
            });
        }

        public abstract void onUiSuccess(String body);

        public abstract void onUiError(Throwable throwable);
    }
}
