import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {RemoteImage} from '../components/RemoteImage';
import {useLanguage} from '../contexts/LanguageContext';
import {ratingService, userService} from '../services/api';
import type {Rating, User} from '../types';
import {colors} from '../theme/colors';
import {RatingStars} from '../components/RatingStars';

export default function UserPublicProfileScreen() {
  const route = useRoute<any>();
  const {t, language} = useLanguage();
  const userId = String(route.params?.userId || '');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  const locale = language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-PT' : language === 'es' ? 'es-ES' : 'en-GB';

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [userData, ratingsData] = await Promise.all([
          userService.getById(userId),
          ratingService.getRatings(userId),
        ]);
        setUser(userData);
        setRatings(Array.isArray(ratingsData?.ratings) ? ratingsData.ratings : Array.isArray(ratingsData) ? ratingsData : []);
        setAverageRating(Number((ratingsData as any)?.averageRating ?? userData?.rating ?? 0) || 0);
      } catch {
        setUser(null);
        setRatings([]);
        setAverageRating(0);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const skillNames = useMemo(() => {
    return Array.isArray(user?.skills)
      ? user.skills.map(skill => skill?.name).filter(Boolean).join(', ')
      : '';
  }, [user?.skills]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No pudimos cargar este perfil.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <RemoteImage
          uri={user.avatar}
          style={styles.avatar}
          fallbackText={user.name?.slice(0, 1)?.toUpperCase() || '👤'}
          fallbackStyle={styles.avatarFallback}
          fallbackTextStyle={styles.avatarFallbackText}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>{user.role === 'patron' ? t('roleCaptain') : t('roleTraveler')}</Text>
        <View style={styles.ratingRow}>
          <RatingStars rating={averageRating} size="md" />
          <Text style={styles.ratingValue}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({ratings.length} reseñas)</Text>
        </View>
      </View>

      {user.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profileBio')}</Text>
          <Text style={styles.sectionText}>{user.bio}</Text>
        </View>
      ) : null}

      {user.role === 'patron' && (user.boatName || user.boatType) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Barco</Text>
          {user.boatName ? <Text style={styles.sectionText}>{t('profileBoatName')}: {user.boatName}</Text> : null}
          {user.boatType ? <Text style={styles.sectionText}>{t('profileBoatType')}: {user.boatType}</Text> : null}
        </View>
      ) : null}

      {skillNames ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiencia</Text>
          <Text style={styles.sectionText}>{skillNames}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profileUserComments')}</Text>
        {ratings.length === 0 ? (
          <Text style={styles.sectionMuted}>Todavía no hay comentarios públicos.</Text>
        ) : (
          ratings.map((rating, index) => (
            <View key={`${rating.id || index}`} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewAuthor}>{(rating as any).ratedByName || rating.ratedBy || t('profileAnonymousUser')}</Text>
                <Text style={styles.reviewDate}>
                  {rating.createdAt ? new Date(rating.createdAt).toLocaleDateString(locale) : t('profileDateUnavailable')}
                </Text>
              </View>
              <RatingStars rating={rating.rating} size="sm" />
              {rating.comment ? <Text style={styles.reviewText}>{rating.comment}</Text> : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16, backgroundColor: colors.background, gap: 12},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: colors.textStrong},
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {width: 120, height: 120, borderRadius: 60, marginBottom: 14, backgroundColor: colors.border},
  avatarFallback: {backgroundColor: '#e0f2fe'},
  avatarFallbackText: {fontSize: 38, fontWeight: '800', color: colors.primary},
  name: {fontSize: 24, fontWeight: '800', color: colors.textStrong, textAlign: 'center'},
  role: {fontSize: 14, color: colors.textSubtle, marginTop: 4},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10},
  ratingValue: {fontSize: 16, fontWeight: '800', color: colors.primary},
  reviewCount: {fontSize: 13, color: colors.textSubtle},
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {fontSize: 16, fontWeight: '800', color: colors.textStrong, marginBottom: 8},
  sectionText: {fontSize: 14, color: colors.text, lineHeight: 21},
  sectionMuted: {fontSize: 14, color: colors.textSubtle},
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 12,
    gap: 6,
  },
  reviewTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  reviewAuthor: {fontSize: 14, fontWeight: '700', color: colors.textStrong, flex: 1},
  reviewDate: {fontSize: 12, color: colors.textSubtle},
  reviewText: {fontSize: 14, color: colors.text, lineHeight: 20},
});