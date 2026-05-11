package com.barcostop.app.ui.util;

import org.json.JSONArray;
import org.json.JSONObject;

public final class ReputationCalculator {
    public static final class Snapshot {
        public final int totalPoints;
        public final String rankName;
        public final String insignia;
        public final int createdTrips;
        public final int completedTrips;
        public final int reviewCount;
        public final boolean profileComplete;

        Snapshot(int totalPoints, String rankName, String insignia, int createdTrips, int completedTrips, int reviewCount, boolean profileComplete) {
            this.totalPoints = totalPoints;
            this.rankName = rankName;
            this.insignia = insignia;
            this.createdTrips = createdTrips;
            this.completedTrips = completedTrips;
            this.reviewCount = reviewCount;
            this.profileComplete = profileComplete;
        }
    }

    private ReputationCalculator() {
    }

    public static Snapshot from(JSONObject user, boolean isCaptain, int createdTrips, int completedTrips, JSONArray ratings) {
        Snapshot backendSnapshot = fromBackend(user);
        if (backendSnapshot != null) {
            return backendSnapshot;
        }

        boolean profileComplete = isProfileComplete(user, isCaptain);
        int profilePoints = profileComplete ? 25 : 0;
        int createdTripPoints = Math.max(0, createdTrips) * 10;
        int completedTripPoints = Math.max(0, completedTrips) * 15;
        int ratingPoints = computeRatingPoints(ratings);
        int reviewCount = ratings == null ? 0 : ratings.length();
        int total = profilePoints + createdTripPoints + completedTripPoints + ratingPoints;
        return new Snapshot(total, rankName(total), insignia(total), createdTrips, completedTrips, reviewCount, profileComplete);
    }

        private static Snapshot fromBackend(JSONObject user) {
        if (user == null) return null;

        JSONObject reputation = user.optJSONObject("reputation");
        int totalPoints = reputation != null
            ? reputation.optInt("totalPoints", user.optInt("totalPoints", Integer.MIN_VALUE))
            : user.optInt("totalPoints", Integer.MIN_VALUE);
        if (totalPoints == Integer.MIN_VALUE) return null;

        String rankName = reputation != null
            ? reputation.optString("rankName", user.optString("rankName", "")).trim()
            : user.optString("rankName", "").trim();
        String rankInsignia = reputation != null
            ? reputation.optString("rankInsignia", user.optString("rankInsignia", "")).trim()
            : user.optString("rankInsignia", "").trim();
        int createdTrips = reputation != null
            ? reputation.optInt("createdTrips", user.optInt("createdTrips", 0))
            : user.optInt("createdTrips", 0);
        int completedTrips = reputation != null
            ? reputation.optInt("completedTrips", user.optInt("completedTrips", 0))
            : user.optInt("completedTrips", 0);
        int reviewCount = reputation != null
            ? reputation.optInt("reviewCount", user.optInt("reviewCount", 0))
            : user.optInt("reviewCount", 0);
        boolean profileComplete = reputation != null
            ? reputation.optBoolean("profileComplete", user.optBoolean("profileComplete", false))
            : user.optBoolean("profileComplete", false);

        if (rankName.isEmpty()) {
            rankName = rankName(totalPoints);
        }
        if (rankInsignia.isEmpty()) {
            rankInsignia = insignia(totalPoints);
        }

        return new Snapshot(totalPoints, rankName, rankInsignia, createdTrips, completedTrips, reviewCount, profileComplete);
        }

    private static int computeRatingPoints(JSONArray ratings) {
        if (ratings == null) return 0;
        int total = 0;
        for (int i = 0; i < ratings.length(); i++) {
            JSONObject row = ratings.optJSONObject(i);
            if (row == null) continue;
            int rating = row.optInt("rating", 0);
            if (rating <= 0) continue;
            total += Math.min(10, rating <= 5 ? rating * 2 : rating);
        }
        return total;
    }

    private static boolean isProfileComplete(JSONObject user, boolean isCaptain) {
        if (user == null) return false;
        String[] commonFields = new String[]{
                first(user, "name", "username"),
                first(user, "bio"),
                first(user, "currentLocation", "current_location"),
                first(user, "instagram"),
                first(user, "phone"),
                first(user, "languages"),
                first(user, "avatar")
        };

        for (String value : commonFields) {
            if (value.isEmpty()) return false;
        }

        if (!isCaptain) {
            String[] travelerFields = new String[]{
                    first(user, "sailingExperience", "sailing_experience"),
                    first(user, "certifications"),
                    first(user, "preferredRoutes", "preferred_routes"),
                    first(user, "skillsGeneral", "skills_general"),
                    first(user, "cleaningLevel", "cleaning_level")
            };
            for (String value : travelerFields) {
                if (value.isEmpty()) return false;
            }
            return true;
        }

        String[] captainFields = new String[]{
                first(user, "boatName", "boat_name"),
                first(user, "boatType", "boat_type"),
                first(user, "boatDetails", "boat_details"),
                first(user, "boatModel", "boat_model"),
                first(user, "boatLengthM", "boat_length_m"),
                first(user, "homePort", "home_port"),
                first(user, "captainLicense", "captain_license"),
                first(user, "boatCapacity", "boat_capacity"),
                first(user, "boatYear", "boat_year"),
                first(user, "boatLicense", "boat_license")
        };
        for (String value : captainFields) {
            if (value.isEmpty()) return false;
        }
        return true;
    }

    private static String first(JSONObject obj, String... keys) {
        if (obj == null) return "";
        for (String key : keys) {
            String value = obj.optString(key, "").trim();
            if (!value.isEmpty()) return value;
        }
        return "";
    }

    private static String rankName(int totalPoints) {
        if (totalPoints >= 100) return "Capitan";
        if (totalPoints >= 75) return "Oficial";
        if (totalPoints >= 50) return "Contramaestre";
        if (totalPoints >= 25) return "Marinero avanzado";
        return "Marinero";
    }

    private static String insignia(int totalPoints) {
        if (totalPoints >= 100) return "⚓⚓⚓⚓";
        if (totalPoints >= 75) return "⚓⚓⚓";
        if (totalPoints >= 50) return "⚓⚓";
        if (totalPoints >= 25) return "⚓";
        return "·";
    }
}