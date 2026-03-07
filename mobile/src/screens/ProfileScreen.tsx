import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList, Image} from 'react-native';
import {launchImageLibrary, type ImageLibraryOptions} from 'react-native-image-picker';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {userService, ratingService, donationService} from '../services/api';
import {RatingStars} from '../components/RatingStars';
import {PayPalWebViewModal} from '../components/PayPalWebViewModal';
import type {UserSkill, Rating} from '../types';
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';
import {radius, shadows, spacing} from '../theme/layout';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const {session, logout} = useAuth();
  const {t} = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');

  const [boatName, setBoatName] = useState('');
  const [boatType, setBoatType] = useState('');
  const [boatDetails, setBoatDetails] = useState('');

  const [skillsGeneral, setSkillsGeneral] = useState('');
  const [skillsLanguages, setSkillsLanguages] = useState('');
  const [cleaningLevel, setCleaningLevel] = useState<UserSkill['level']>('intermedio');
  
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [paypalVisible, setPaypalVisible] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');
  const [pendingDonationAmount, setPendingDonationAmount] = useState<number | null>(null);

  const safeAverageRating = (() => {
    const parsed = Number(averageRating);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(5, Math.max(0, parsed));
  })();

  const normalizeReviewerName = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
    if (value && typeof value === 'object') {
      const candidate = (value as any).name ?? (value as any).email ?? (value as any).id;
      if (typeof candidate === 'string' && candidate.trim()) return candidate;
    }
    return 'Usuario anonimo';
  };

  const formatReviewDate = (value: unknown) => {
    const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }
    return date.toLocaleDateString('es-ES');
  };

  const sanitizeAvatarUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^(https?:\/\/|content:\/\/|file:\/\/|ph:\/\/|assets-library:\/\/)/i.test(trimmed)) return trimmed;
    return '';
  };

  const isLocalAvatarUri = (value: string): boolean => /^(content:\/\/|file:\/\/|ph:\/\/|assets-library:\/\/)/i.test(value.trim());

  const pickAvatarFromGallery = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    };

    try {
      const response = await launchImageLibrary(options);

      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        feedback.info('No se pudo abrir la galeria', 'Aviso');
        return;
      }

      const selectedUri = response.assets?.[0]?.uri?.trim();
      if (!selectedUri) {
        feedback.info('No se pudo obtener la foto seleccionada', 'Aviso');
        return;
      }

      setAvatarUrl(selectedUri);
    } catch (_error) {
      feedback.info('No se pudo seleccionar la foto', 'Aviso');
    }
  };

  const openPayPalDonation = (amount: number) => {
    const fixedAmount = Math.max(2.5, amount);
    setPendingDonationAmount(fixedAmount);
    setPaypalUrl(`https://paypal.me/BarcoStop/${fixedAmount.toFixed(2)}`);
    setPaypalVisible(true);
  };

  const handleCloseDonationWebView = () => {
    setPaypalVisible(false);

    if (!pendingDonationAmount || !session?.userId) {
      return;
    }

    feedback.confirm(
      'Confirmar donación',
      `¿Completaste la donación de €${pendingDonationAmount.toFixed(2)} en PayPal?`,
      [
        {text: 'No todavía', style: 'cancel'},
        {
          text: 'Sí, confirmar',
          onPress: async () => {
            try {
              await donationService.createDonation({
                userId: session.userId,
                amount: pendingDonationAmount,
              });
              feedback.success(`Donacion de €${pendingDonationAmount.toFixed(2)} registrada`, 'Gracias');
            } catch (error) {
              feedback.info('No pudimos registrar la donacion automaticamente', 'Aviso');
            } finally {
              setPendingDonationAmount(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.userId) {
        setLoading(false);
        return;
      }
      try {
        const data = await userService.getById(session.userId);
        
        // Validar que data existe y es un objeto válido
        if (!data || typeof data !== 'object') {
          console.warn('Invalid user data received:', data);
          setLoading(false);
          return;
        }

        setName(data.name || '');
        setAvatarUrl(typeof data.avatar === 'string' ? data.avatar : '');
        setBio(data.bio || '');
        setBoatName(data.boatName || '');
        setBoatType(data.boatType || '');

        // Validar que skills es un array
        const skills = Array.isArray(data.skills) ? data.skills : [];
        const languageSkills = skills.filter(s => s && s.name && typeof s.name === 'string' && s.name.toLowerCase().startsWith('idioma:'));
        const cleaningSkill = skills.find(s => s && s.name && typeof s.name === 'string' && s.name.toLowerCase() === 'limpieza');
        const otherSkills = skills.filter(
          s => s && s.name && typeof s.name === 'string' && !s.name.toLowerCase().startsWith('idioma:') && s.name.toLowerCase() !== 'limpieza',
        );

        setSkillsLanguages(languageSkills.map(s => s.name ? s.name.replace(/^idioma:\s*/i, '') : '').filter(Boolean).join(', '));
        setSkillsGeneral(otherSkills.map(s => s.name || '').filter(Boolean).join(', '));
        if (cleaningSkill && cleaningSkill.level) setCleaningLevel(cleaningSkill.level);

        // Cargar ratings
        try {
          setRatingsLoading(true);
          const ratingsData = await ratingService.getRatings(session.userId);
          setAverageRating(Number(ratingsData.averageRating) || 0);
          const safeRatings = Array.isArray(ratingsData.ratings)
            ? ratingsData.ratings.map((raw: any) => ({
                ...raw,
                id: String(raw?.id ?? `${raw?.ratedBy ?? 'anon'}-${raw?.createdAt ?? Date.now()}`),
                rating: Number(raw?.rating ?? 0),
                comment: typeof raw?.comment === 'string' ? raw.comment : '',
                ratedBy: normalizeReviewerName(raw?.ratedBy),
                createdAt: typeof raw?.createdAt === 'string' || typeof raw?.createdAt === 'number'
                  ? String(raw.createdAt)
                  : '',
              }))
            : [];
          setRatings(safeRatings);
        } catch (ratingError) {
          console.warn('Error loading ratings:', ratingError);
        } finally {
          setRatingsLoading(false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        feedback.alert(t('alertErrorTitle'), t('profileLoadError'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [session?.userId, t]);

  const splitCsv = (text: string) =>
    text
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  const onSave = async () => {
    if (!session?.userId) return;

    const general = splitCsv(skillsGeneral).map(name => ({name, level: 'intermedio' as const}));
    const languages = splitCsv(skillsLanguages).map(name => ({name: `Idioma: ${name}`, level: 'intermedio' as const}));
    const cleaning = [{name: 'Limpieza', level: cleaningLevel}];

    const skills = session.role === 'viajero' ? [...general, ...languages, ...cleaning] : [];

    try {
      setSaving(true);
      let resolvedAvatar = sanitizeAvatarUrl(avatarUrl);

      if (resolvedAvatar && isLocalAvatarUri(resolvedAvatar)) {
        const uploadedUrl = await userService.uploadAvatar(session.userId, resolvedAvatar);
        if (!uploadedUrl) {
          throw new Error('No se pudo subir el avatar');
        }
        resolvedAvatar = uploadedUrl;
        setAvatarUrl(uploadedUrl);
      }

      await userService.update(session.userId, {
        name: name.trim() || session.name,
        avatar: resolvedAvatar,
        bio: bio.trim(),
        boatName: session.role === 'patron' ? boatName.trim() : undefined,
        boatType: session.role === 'patron' ? `${boatType.trim()}${boatDetails.trim() ? ` · ${boatDetails.trim()}` : ''}` : undefined,
        skills,
      });
      feedback.alert(t('alertOkTitle'), t('profileSaved'));
    } catch (_e) {
      feedback.alert(t('alertErrorTitle'), t('profileLoadError'));
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    feedback.confirm(t('profileLogoutTitle'), t('profileLogoutMessage'), [
      {text: t('profileCancel'), style: 'cancel'},
      {
        text: t('profileConfirm'),
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeBtnText}>🏠 {t('goHome')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('profileTitle')}</Text>
      <Text style={styles.line}>{t('profileEmail')}: {session?.email}</Text>
      <Text style={[styles.line, styles.roleLine]}>
        {t('profileRole')}: {session?.role === 'patron' ? t('roleCaptain') : t('roleTraveler')}
      </Text>

      <View style={styles.avatarSection}>
        <Text style={styles.avatarTitle}>Foto de perfil</Text>
        <View style={styles.avatarMediaWrap}>
          {sanitizeAvatarUrl(avatarUrl) ? (
            <Image source={{uri: sanitizeAvatarUrl(avatarUrl)}} style={styles.avatarPreview} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>📷</Text>
            </View>
          )}
        </View>
        <TextInput
          style={[styles.input, styles.avatarInput]}
          placeholder="URL de foto (https://...)"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.galleryBtn} onPress={pickAvatarFromGallery}>
          <Text style={styles.galleryBtnText}>Elegir de galeria</Text>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>
          Puedes pegar URL publica o elegir una foto desde tu galeria.
        </Text>
      </View>

      {/* Sección de Ratings */}
      <View style={styles.ratingsSection}>
        <Text style={styles.sectionTitle}>⭐ Puntuación</Text>
        <View style={styles.ratingCard}>
          <View style={styles.ratingHeaderRow}>
            <View style={styles.ratingHeaderLeft}>
              <Text style={styles.ratingTitle}>Mi Puntuación</Text>
              <View style={styles.ratingStarContainer}>
                <RatingStars rating={safeAverageRating} size="lg" />
                <Text style={styles.ratingScore}>{safeAverageRating.toFixed(1)}</Text>
              </View>
            </View>
            <View style={styles.ratingHeaderRight}>
              <Text style={styles.ratingCount}>{ratings.length}</Text>
              <Text style={styles.ratingCountLabel}>comentarios</Text>
            </View>
          </View>
        </View>

        {/* Lista de Reviews */}
        {ratings.length > 0 && (
          <View style={styles.reviewsList}>
            <Text style={styles.reviewsTitle}>Comentarios de usuarios</Text>
            {ratings.map((rating) => (
              <View key={rating.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.avatarText}>👤</Text>
                    </View>
                    <View style={styles.reviewerDetails}>
                      <Text style={styles.reviewerName}>{rating.ratedBy || 'Usuario anónimo'}</Text>
                      <Text style={styles.reviewDate}>
                        {formatReviewDate(rating.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <RatingStars rating={rating.rating} size="sm" />
                </View>
                {rating.comment && (
                  <Text style={styles.reviewComment}>{rating.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.label}>{t('profileName')}</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>{t('profileBio')}</Text>
      <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} multiline />

      {session?.role === 'patron' ? (
        <>
          <Text style={styles.sectionTitle}>⛵ {t('roleCaptain')}</Text>

          <Text style={styles.label}>{t('profileBoatName')}</Text>
          <TextInput style={styles.input} value={boatName} onChangeText={setBoatName} />

          <Text style={styles.label}>{t('profileBoatType')}</Text>
          <TextInput style={styles.input} value={boatType} onChangeText={setBoatType} />

          <Text style={styles.label}>{t('profileBoatDetails')}</Text>
          <TextInput style={[styles.input, styles.multiline]} value={boatDetails} onChangeText={setBoatDetails} multiline />
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>🧭 {t('roleTraveler')}</Text>

          <Text style={styles.label}>{t('profileSkillsGeneral')}</Text>
          <TextInput style={[styles.input, styles.multiline]} value={skillsGeneral} onChangeText={setSkillsGeneral} multiline />

          <Text style={styles.label}>{t('profileSkillsLanguages')}</Text>
          <TextInput style={styles.input} value={skillsLanguages} onChangeText={setSkillsLanguages} />

          <Text style={styles.label}>{t('profileSkillsCleaning')}</Text>
          <View style={styles.levelRow}>
            {(
              [
                ['principiante', t('levelBeginner')],
                ['intermedio', t('levelIntermediate')],
                ['experto', t('levelExpert')],
              ] as const
            ).map(([level, label]) => (
              <TouchableOpacity
                key={level}
                style={[styles.levelBtn, cleaningLevel === level && styles.levelBtnActive]}
                onPress={() => setCleaningLevel(level)}>
                <Text style={[styles.levelText, cleaningLevel === level && styles.levelTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={[styles.saveButton, saving && styles.buttonDisabled]} onPress={onSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? t('profileSaving') : t('profileSave')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>{t('profileLogout')}</Text>
      </TouchableOpacity>

      {/* Botón de donación PayPal */}
      <View style={styles.donationSection}>
        <Text style={styles.donationMessage}>
          Gracias por invitar al equipo BarcoStop, una birra o café ☕
        </Text>
        <TouchableOpacity 
          style={styles.donationBtn}
          onPress={() => {
            feedback.confirm(
              '💙 Donación PayPal',
              'Gracias por tu apoyo al equipo BarcoStop. Mínimo de donación: €2.50',
              [
                {text: 'Cancelar', style: 'cancel'},
                {
                  text: 'Donar €2.50',
                  onPress: () => {
                    openPayPalDonation(2.5);
                  }
                },
                {
                  text: 'Donar €5.00',
                  onPress: () => {
                    openPayPalDonation(5);
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.donationBtnText}>💳 Donar con PayPal</Text>
        </TouchableOpacity>
      </View>

      <PayPalWebViewModal
        visible={paypalVisible}
        url={paypalUrl}
        title="Donación con PayPal"
        onClose={handleCloseDonationWebView}
      />
      
      {/* Espaciador para permitir scroll */}
      <View style={{height: 100}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: spacing.xl, backgroundColor: colors.background},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background},
  homeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  homeBtnText: {color: colors.text, fontWeight: '700'},
  title: {fontSize: 24, fontWeight: '800', marginBottom: 16, color: colors.text},
  line: {fontSize: 16, marginBottom: 6, color: colors.textStrong},
  roleLine: {marginBottom: 14},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 6, marginBottom: 10},
  label: {fontSize: 13, color: colors.textStrong, fontWeight: '600', marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  multiline: {minHeight: 70, textAlignVertical: 'top'},
  levelRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  levelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  levelBtnActive: {borderColor: colors.primary, backgroundColor: '#e0f2fe'},
  levelText: {color: colors.textStrong, fontWeight: '600', fontSize: 12},
  levelTextActive: {color: colors.primaryAlt},
  saveButton: {marginTop: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 14},
  saveText: {textAlign: 'center', color: colors.white, fontWeight: '700'},
  buttonDisabled: {opacity: 0.6},
  logoutButton: {marginTop: spacing.md, backgroundColor: colors.danger, borderRadius: radius.lg, paddingVertical: 14},
  logoutText: {textAlign: 'center', color: colors.white, fontWeight: '700'},
  
  // Donation styles
  donationSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  avatarSection: {
    marginBottom: spacing.lg,
    alignItems: 'stretch',
  },
  avatarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  avatarMediaWrap: {
    alignItems: 'center',
  },
  avatarPreview: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {fontSize: 28},
  avatarHint: {
    fontSize: 12,
    color: colors.textMuted,
    alignSelf: 'flex-start',
    marginTop: -4,
    marginBottom: spacing.sm,
  },
  donationMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  donationBtn: {
    backgroundColor: '#003087',
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  donationBtnText: {
    textAlign: 'center',
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Rating styles
  ratingsSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarInput: {
    width: '100%',
  },
  galleryBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  galleryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  ratingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingHeaderLeft: {
    flex: 1,
  },
  ratingTitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  ratingStarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  ratingHeaderRight: {
    alignItems: 'center',
    paddingLeft: 20,
  },
  ratingCount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  ratingCountLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  reviewsList: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  reviewsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: colors.textStrong,
    lineHeight: 18,
  },
});
