package com.barcostop.app.ui.screens;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.actions.BoatActions;
import com.barcostop.app.core.storage.SessionStore;
import com.barcostop.app.ui.adapters.BoatManageAdapter;
import com.barcostop.app.ui.feedback.FeedbackFx;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class BoatsActivity extends AppCompatActivity {
    private BoatActions boatActions;
    private SessionStore sessionStore;

    private ProgressBar loading;
    private TextView empty;
    private LinearLayout form;
    private EditText nameInput;
    private EditText typeInput;
    private EditText capacityInput;
    private EditText safetyInput;
    private EditText descriptionInput;
    private BoatManageAdapter adapter;

    private final List<BoatManageAdapter.Item> boats = new ArrayList<>();
    private String editingBoatId = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_boats);
        setTitle(R.string.screen_boats);

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        boatActions = new BoatActions(app.getApiClient());
        sessionStore = app.getSessionStore();

        loading = findViewById(R.id.boats_loading);
        empty = findViewById(R.id.boats_empty);
        form = findViewById(R.id.boats_form);
        nameInput = findViewById(R.id.boats_name_input);
        typeInput = findViewById(R.id.boats_type_input);
        capacityInput = findViewById(R.id.boats_capacity_input);
        safetyInput = findViewById(R.id.boats_safety_input);
        descriptionInput = findViewById(R.id.boats_description_input);

        RecyclerView recycler = findViewById(R.id.boats_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BoatManageAdapter(new BoatManageAdapter.Actions() {
            @Override
            public void onEdit(BoatManageAdapter.Item item) {
                editBoat(item);
            }

            @Override
            public void onDelete(BoatManageAdapter.Item item) {
                deleteBoat(item);
            }
        });
        recycler.setAdapter(adapter);

        Button add = findViewById(R.id.boats_add_button);
        Button save = findViewById(R.id.boats_save_button);
        Button cancel = findViewById(R.id.boats_cancel_button);
        add.setOnClickListener(v -> startCreate());
        save.setOnClickListener(v -> saveBoat());
        cancel.setOnClickListener(v -> hideForm());

        loadBoats();
    }

    private void loadBoats() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) {
            finish();
            return;
        }

        loading.setVisibility(View.VISIBLE);
        boatActions.listBoatsByPatron(userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                loading.setVisibility(View.GONE);
                boats.clear();
                try {
                    JSONArray arr = new JSONArray(body);
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.optJSONObject(i);
                        if (obj == null) continue;

                        BoatManageAdapter.Item item = new BoatManageAdapter.Item();
                        item.id = readFirst(obj, "id");
                        item.name = readFirst(obj, "name");
                        item.type = readFirst(obj, "type");
                        item.capacity = parseInt(readFirst(obj, "capacity"), 1);
                        item.description = readFirst(obj, "description");
                        item.safety = parseSafety(obj.optJSONArray("safetyEquipment"));
                        boats.add(item);
                    }
                } catch (Throwable ignored) {
                }

                adapter.submit(boats);
                empty.setVisibility(boats.isEmpty() ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onUiError(Throwable throwable) {
                loading.setVisibility(View.GONE);
                empty.setVisibility(View.VISIBLE);
                FeedbackFx.error(BoatsActivity.this, getString(R.string.boats_load_error));
            }
        });
    }

    private void startCreate() {
        editingBoatId = "";
        nameInput.setText("");
        typeInput.setText("");
        capacityInput.setText("1");
        safetyInput.setText("");
        descriptionInput.setText("");
        form.setVisibility(View.VISIBLE);
    }

    private void editBoat(BoatManageAdapter.Item item) {
        editingBoatId = item.id;
        nameInput.setText(item.name);
        typeInput.setText(item.type);
        capacityInput.setText(String.valueOf(item.capacity));
        safetyInput.setText(item.safety);
        descriptionInput.setText(item.description);
        form.setVisibility(View.VISIBLE);
    }

    private void hideForm() {
        form.setVisibility(View.GONE);
        editingBoatId = "";
    }

    private void saveBoat() {
        String userId = safe(sessionStore.getUserId());
        if (userId.isEmpty()) return;

        String name = safe(text(nameInput));
        String type = safe(text(typeInput));
        int capacity = parseInt(text(capacityInput), 1);
        if (name.isEmpty() || type.isEmpty()) {
            FeedbackFx.info(this, getString(R.string.boats_required_name_type));
            return;
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("actorId", userId);
            payload.put("patronId", userId);
            payload.put("name", name);
            payload.put("type", type);
            payload.put("capacity", capacity);
            payload.put("description", text(descriptionInput));
            payload.put("safetyEquipment", parseSafetyJson(text(safetyInput)));

            UiApiCallback cb = new UiApiCallback(this) {
                @Override
                public void onUiSuccess(String body) {
                    FeedbackFx.success(BoatsActivity.this, getString(R.string.boats_saved_ok));
                    hideForm();
                    loadBoats();
                }

                @Override
                public void onUiError(Throwable throwable) {
                    FeedbackFx.error(BoatsActivity.this, getString(R.string.boats_save_error));
                }
            };

            if (editingBoatId.isEmpty()) {
                boatActions.createBoat(payload.toString(), cb);
            } else {
                boatActions.updateBoat(editingBoatId, payload.toString(), cb);
            }
        } catch (Throwable throwable) {
            FeedbackFx.error(this, getString(R.string.boats_save_error));
        }
    }

    private void deleteBoat(BoatManageAdapter.Item item) {
        String userId = safe(sessionStore.getUserId());
        if (item.id.isEmpty() || userId.isEmpty()) return;
        boatActions.deleteBoat(item.id, userId, new UiApiCallback(this) {
            @Override
            public void onUiSuccess(String body) {
                FeedbackFx.success(BoatsActivity.this, getString(R.string.boats_deleted_ok));
                loadBoats();
            }

            @Override
            public void onUiError(Throwable throwable) {
                FeedbackFx.error(BoatsActivity.this, getString(R.string.boats_delete_error));
            }
        });
    }

    private static JSONArray parseSafetyJson(String raw) {
        JSONArray out = new JSONArray();
        String[] chunks = safe(raw).split(",");
        for (String chunk : chunks) {
            String value = chunk.trim();
            if (!value.isEmpty()) out.put(value);
        }
        return out;
    }

    private static String parseSafety(JSONArray array) {
        if (array == null || array.length() == 0) return "";
        List<String> parts = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            String value = safe(array.optString(i, ""));
            if (!value.isEmpty()) parts.add(value);
        }
        return String.join(", ", parts);
    }

    private static String readFirst(JSONObject obj, String... keys) {
        for (String key : keys) {
            String value = obj.optString(key, "").trim();
            if (!value.isEmpty()) return value;
        }
        return "";
    }

    private static String text(EditText input) {
        return input.getText() == null ? "" : input.getText().toString().trim();
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static int parseInt(String raw, int fallback) {
        try {
            return Integer.parseInt(raw.trim());
        } catch (Throwable ignored) {
            return fallback;
        }
    }

    private abstract static class UiApiCallback implements com.barcostop.app.core.network.ApiCallback {
        private final AppCompatActivity activity;

        UiApiCallback(AppCompatActivity activity) {
            this.activity = activity;
        }

        @Override
        public final void onSuccess(String body) {
            activity.runOnUiThread(() -> onUiSuccess(body));
        }

        @Override
        public final void onError(Throwable throwable) {
            activity.runOnUiThread(() -> onUiError(throwable));
        }

        public abstract void onUiSuccess(String body);

        public abstract void onUiError(Throwable throwable);
    }
}
