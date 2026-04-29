package com.barcostop.app.ui.screens;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.barcostop.app.R;
import com.barcostop.app.core.BarcoStopApplication;
import com.barcostop.app.core.auth.AuthSessionManager;
import com.barcostop.app.ui.fragments.MessagesFragment;
import com.barcostop.app.ui.fragments.PatronRequestsFragment;
import com.barcostop.app.ui.fragments.ProfileFragment;
import com.barcostop.app.ui.fragments.ReservationsFragment;
import com.barcostop.app.ui.fragments.FavoritesFragment;
import com.barcostop.app.ui.fragments.ShareFragment;
import com.barcostop.app.ui.fragments.TripsFragment;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;

public class MainAppActivity extends AppCompatActivity {
    public static final String EXTRA_INITIAL_TAB = "initial_tab";
    public static final String TAB_TRIPS = "trips";
    public static final String TAB_SECONDARY = "secondary";
    public static final String TAB_MESSAGES = "messages";
    public static final String TAB_FAVORITES = "favorites";
    public static final String TAB_SHARE = "share";
    public static final String TAB_PROFILE = "profile";

    private AuthSessionManager authSessionManager;
    private String initialTab = TAB_TRIPS;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        BarcoStopApplication app = (BarcoStopApplication) getApplication();
        authSessionManager = new AuthSessionManager(app.getSessionStore());

        if (!authSessionManager.hasActiveSession()) {
            openHomeAndFinish();
            return;
        }

        setContentView(R.layout.activity_main_app);
        initialTab = normalizeTab(getIntent().getStringExtra(EXTRA_INITIAL_TAB));
        setupToolbar();
        setupBottomNav();

        if (savedInstanceState == null) {
            selectInitialTab();
        }
    }

    private void setupToolbar() {
        MaterialToolbar toolbar = findViewById(R.id.main_toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(R.string.main_title);
            getSupportActionBar().setSubtitle(null);
        }
    }

    private void setupBottomNav() {
        BottomNavigationView bottomNav = findViewById(R.id.main_bottom_nav);

        Menu menu = bottomNav.getMenu();
        MenuItem secondaryItem = menu.findItem(R.id.nav_secondary);
        if (HomeActivity.ROLE_PATRON.equals(authSessionManager.getRole())) {
            secondaryItem.setTitle(R.string.tab_requests);
        } else {
            secondaryItem.setTitle(R.string.tab_reservations);
        }

        bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.nav_trips) {
                switchFragment(new TripsFragment(), R.string.tab_trips);
                return true;
            }
            if (itemId == R.id.nav_secondary) {
                if (HomeActivity.ROLE_PATRON.equals(authSessionManager.getRole())) {
                    switchFragment(new PatronRequestsFragment(), R.string.tab_requests);
                } else {
                    switchFragment(new ReservationsFragment(), R.string.tab_reservations);
                }
                return true;
            }
            if (itemId == R.id.nav_messages) {
                switchFragment(new MessagesFragment(), R.string.tab_messages);
                return true;
            }
            if (itemId == R.id.nav_favorites) {
                switchFragment(new FavoritesFragment(), R.string.tab_favorites);
                return true;
            }
            if (itemId == R.id.nav_profile) {
                switchFragment(new ProfileFragment(), R.string.tab_profile);
                return true;
            }
            return false;
        });

        bottomNav.setSelectedItemId(mapTabToMenuId(initialTab));
    }

    private void switchFragment(Fragment fragment, int titleResId) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.main_fragment_container, fragment)
                .commit();
        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(titleResId);
            getSupportActionBar().setSubtitle(null);
        }
    }

    private void selectInitialTab() {
        if (TAB_SHARE.equals(initialTab)) {
            switchFragment(new ShareFragment(), R.string.tab_share);
            return;
        }
        int itemId = mapTabToMenuId(initialTab);
        BottomNavigationView bottomNav = findViewById(R.id.main_bottom_nav);
        bottomNav.setSelectedItemId(itemId);
    }

    private static int mapTabToMenuId(String tab) {
        if (TAB_SECONDARY.equals(tab)) return R.id.nav_secondary;
        if (TAB_MESSAGES.equals(tab)) return R.id.nav_messages;
        if (TAB_FAVORITES.equals(tab)) return R.id.nav_favorites;
        if (TAB_PROFILE.equals(tab)) return R.id.nav_profile;
        return R.id.nav_trips;
    }

    private static String normalizeTab(String tab) {
        if (TAB_SECONDARY.equals(tab)) return TAB_SECONDARY;
        if (TAB_MESSAGES.equals(tab)) return TAB_MESSAGES;
        if (TAB_FAVORITES.equals(tab)) return TAB_FAVORITES;
        if (TAB_SHARE.equals(tab)) return TAB_SHARE;
        if (TAB_PROFILE.equals(tab)) return TAB_PROFILE;
        return TAB_TRIPS;
    }

    public void forceLogoutToHome() {
        authSessionManager.clearSession();
        openHomeAndFinish();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main_app_actions, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int itemId = item.getItemId();
        if (itemId == R.id.action_share_hub) {
            switchFragment(new ShareFragment(), R.string.tab_share);
            return true;
        }
        if (itemId == R.id.action_logout) {
            forceLogoutToHome();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void openHomeAndFinish() {
        Intent intent = new Intent(this, HomeActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
