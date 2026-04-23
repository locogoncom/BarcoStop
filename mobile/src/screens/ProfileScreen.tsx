import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {launchImageLibrary, type ImageLibraryOptions} from 'react-native-image-picker';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {buildPayPalMeUrl} from '../config/paypal';
import {userService, ratingService, donationService, supportMessageService} from '../services/api';
import {RemoteImage} from '../components/RemoteImage';
import {RatingStars} from '../components/RatingStars';
import {PayPalWebViewModal} from '../components/PayPalWebViewModal';
import type {UserSkill, Rating, SupportMessage} from '../types';
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';
import {radius, shadows, spacing} from '../theme/layout';
import {getErrorMessage, isNotFoundError} from '../utils/errors';
import {normalizeRemoteAssetUrl} from '../utils/assets';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const {session, logout} = useAuth();
  const {t, language} = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarLocalMeta, setAvatarLocalMeta] = useState<{uri: string; fileName?: string; type?: string} | null>(null);
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
  const [supportExpanded, setSupportExpanded] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportDraft, setSupportDraft] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportLoaded, setSupportLoaded] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [deletingSupportId, setDeletingSupportId] = useState<string | null>(null);

  const goToHome = () => {
    const rootNav = navigation.getParent()?.getParent?.() || navigation.getParent?.() || navigation;
    rootNav.reset({
      index: 0,
      routes: [{name: 'MainApp', state: {index: 0, routes: [{name: 'Trips'}]}}],
    });
  };

  const locale = language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-PT' : language === 'es' ? 'es-ES' : 'en-GB';

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
    return t('profileAnonymousUser');
  };

  const formatReviewDate = (value: unknown) => {
    const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return t('profileDateUnavailable');
    }
    return date.toLocaleDateString(locale);
  };

  const formatSupportDate = (value: number | undefined) => {
    if (!value || !Number.isFinite(value)) return t('profileDateUnavailable');
    return new Date(value).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSupportStatusLabel = (status: SupportMessage['status']) => {
    if (status === 'answered') return t('profileImproveStatusAnswered');
    if (status === 'closed') return t('profileImproveStatusClosed');
    return t('profileImproveStatusOpen');
  };

  const sanitizeAvatarUrl = (value: string): string => {
    return normalizeRemoteAssetUrl(value) || '';
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
        feedback.info(t('profileAvatarOpenError'), t('alertErrorTitle'));
        return;
      }

      const asset = response.assets?.[0];
      const selectedUri = asset?.uri?.trim();
      if (!selectedUri) {
        feedback.info(t('profileAvatarReadError'), t('alertErrorTitle'));
        return;
      }

      const selectedType = typeof asset?.type === 'string' ? asset.type : undefined;
      const selectedFileName = typeof asset?.fileName === 'string' ? asset.fileName : undefined;
      const selectedFileSize = typeof asset?.fileSize === 'number' ? asset.fileSize : undefined;

      if (selectedType && /image\/hei(c|f)/i.test(selectedType)) {
        feedback.error(t('profileAvatarFormatError'));
        return;
      }

      // Backend limita avatar a 5MB
      if (selectedFileSize && selectedFileSize > 5 * 1024 * 1024) {
        feedback.error(t('profileAvatarTooLarge'));
        return;
      }

      setAvatarUrl(selectedUri);
      setAvatarLocalMeta({uri: selectedUri, fileName: selectedFileName, type: selectedType});
    } catch (_error) {
      feedback.info(t('profileAvatarSelectError'), t('alertErrorTitle'));
    }
  };

  const openPayPalDonation = (amount: number) => {
    const fixedAmount = Math.max(2.5, amount);
    setPendingDonationAmount(fixedAmount);
    setPaypalUrl(buildPayPalMeUrl(fixedAmount, 2.5));
    setPaypalVisible(true);
  };

  const handleCloseDonationWebView = () => {
    setPaypalVisible(false);

    if (!pendingDonationAmount || !session?.userId) {
      return;
    }

    feedback.confirm(
      t('profileDonationConfirmTitle'),
      t('profileDonationConfirmMessage').replace('{{amount}}', pendingDonationAmount.toFixed(2)),
      [
        {text: t('profileCancel'), style: 'cancel'},
        {
          text: t('profileConfirm'),
          onPress: async () => {
            try {
              await donationService.createDonation({
                userId: session.userId,
                amount: pendingDonationAmount,
              });
              feedback.success(
                t('profileDonationRecorded').replace('{{amount}}', pendingDonationAmount.toFixed(2)),
                t('alertOkTitle'),
              );
            } catch (error) {
              feedback.info(t('profileDonationRecordFailed'), t('alertErrorTitle'));
            } finally {
              setPendingDonationAmount(null);
            }
          },
        },
      ]
    );
  };

  const loadSupportMessages = async () => {
    if (!session?.userId) return;
    try {
      setSupportLoading(true);
      const data = await supportMessageService.getUserMessages(session.userId);
      setSupportMessages(data);
    } catch (error) {
      if (!isNotFoundError(error)) {
        feedback.error(getErrorMessage(error, t('profileImproveLoadError')));
      }
    } finally {
      setSupportLoaded(true);
      setSupportLoading(false);
    }
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
        feedback.alert(t('alertErrorTitle'), getErrorMessage(error, t('profileLoadError')));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [session?.userId, t, locale]);

  useEffect(() => {
    if (supportExpanded && session?.userId && !supportLoaded && !supportLoading) {
      loadSupportMessages();
    }
  }, [supportExpanded, session?.userId, supportLoaded, supportLoading]);

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
        const meta = avatarLocalMeta?.uri === resolvedAvatar ? avatarLocalMeta : null;
        const uploadedUrl = await userService.uploadAvatar(session.userId, resolvedAvatar, {
          filename: meta?.fileName,
          mimeType: meta?.type,
        });
        if (!uploadedUrl) {
          throw new Error(t('profileAvatarUploadError'));
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
      setAvatarLocalMeta(null);
    } catch (_e: any) {
      feedback.alert(t('alertErrorTitle'), getErrorMessage(_e, t('profileSaveError')));
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
          // Volver siempre a la pantalla de inicio tras cerrar sesión
          const rootNav = navigation.getParent()?.getParent?.() || navigation.getParent?.() || navigation;
          rootNav.reset({
            index: 0,
            routes: [{name: 'Home'}],
          });
        },
      },
    ]);
  };

  const handleSendSupportMessage = async () => {
    if (!session?.userId) return;

    const message = supportDraft.trim();
    if (!message) {
      feedback.info(t('profileImproveInputPlaceholder'), t('alertMissingTitle'));
      return;
    }

    try {
      setSupportSending(true);
      const created = await supportMessageService.createMessage({userId: session.userId, message});
      setSupportMessages(prev => [created, ...prev]);
      setSupportDraft('');
      setSupportLoaded(true);
      setSupportExpanded(true);
      feedback.success(t('profileImproveSent'), t('alertOkTitle'));
    } catch (error) {
      feedback.error(getErrorMessage(error, t('profileImproveSendError')));
    } finally {
      setSupportSending(false);
    }
  };

  const handleDeleteSupportMessage = (id: string) => {
    feedback.confirm(t('profileImproveDeleteTitle'), t('profileImproveDeleteMessage'), [
      {text: t('profileCancel'), style: 'cancel'},
      {
        text: t('profileImproveDelete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingSupportId(id);
            await supportMessageService.deleteMessage(id);
            setSupportMessages(prev => prev.filter(item => item.id !== id));
            feedback.success(t('profileImproveDeleted'), t('alertOkTitle'));
          } catch (error) {
            feedback.error(getErrorMessage(error, t('profileImproveDeleteError')));
          } finally {
            setDeletingSupportId(null);
          }
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
      <View style={styles.topActionsRow}>
        <TouchableOpacity style={styles.homeBtn} onPress={goToHome}>
          <Text style={styles.homeBtnText}>🏠 {t('goHome')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitBtn} onPress={onLogout}>
          <Text style={styles.exitBtnText}>🚪 {t('profileLogout')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{t('profileTitle')}</Text>
      <Text style={styles.line}>{t('profileEmail')}: {session?.email}</Text>
      <Text style={[styles.line, styles.roleLine]}>
        {t('profileRole')}: {session?.role === 'patron' ? t('roleCaptain') : t('roleTraveler')}
      </Text>

      <View style={styles.avatarSection}>
        <Text style={styles.avatarTitle}>{t('profilePhotoTitle')}</Text>
        <View style={styles.avatarMediaWrap}>
          {sanitizeAvatarUrl(avatarUrl) ? (
            <RemoteImage
              uri={avatarUrl}
              style={styles.avatarPreview}
              fallbackText="📷"
              fallbackStyle={styles.avatarFallback}
              fallbackTextStyle={styles.avatarFallbackText}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>📷</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickAvatarFromGallery}>
          <Text style={styles.galleryBtnText}>{t('profileChooseGallery')}</Text>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>{t('profileAvatarHint')}</Text>
      </View>

      {/* Sección de Ratings */}
      <View style={styles.ratingsSection}>
        <Text style={styles.sectionTitle}>⭐ {t('profileRatingTitle')}</Text>
        <View style={styles.ratingCard}>
          <View style={styles.ratingHeaderRow}>
            <View style={styles.ratingHeaderLeft}>
              <Text style={styles.ratingTitle}>{t('profileMyRating')}</Text>
              <View style={styles.ratingStarContainer}>
                <RatingStars rating={safeAverageRating} size="lg" />
                <Text style={styles.ratingScore}>{safeAverageRating.toFixed(1)}</Text>
              </View>
            </View>
            <View style={styles.ratingHeaderRight}>
              <Text style={styles.ratingCount}>{ratings.length}</Text>
              <Text style={styles.ratingCountLabel}>{t('profileCommentsCount')}</Text>
            </View>
          </View>
        </View>

        {/* Lista de Reviews */}
        {ratings.length > 0 && (
          <View style={styles.reviewsList}>
            <Text style={styles.reviewsTitle}>{t('profileUserComments')}</Text>
            {ratings.map((rating) => (
              <View key={rating.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.avatarText}>👤</Text>
                    </View>
                    <View style={styles.reviewerDetails}>
                      <Text style={styles.reviewerName}>{rating.ratedBy || t('profileAnonymousUser')}</Text>
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

      {/* Botón de donación PayPal */}
      <View style={styles.donationSection}>
        <Text style={styles.donationMessage}>
          {t('profileDonationThanks')} ☕
        </Text>
        <TouchableOpacity 
          style={styles.donationBtn}
          onPress={() => {
            feedback.confirm(
              `💙 ${t('profileDonateTitle')}`,
              t('profileDonatePrompt'),
              [
                {text: t('profileCancel'), style: 'cancel'},
                {
                  text: t('profileDonateSmall'),
                  onPress: () => {
                    openPayPalDonation(2.5);
                  }
                },
                {
                  text: t('profileDonateMedium'),
                  onPress: () => {
                    openPayPalDonation(5);
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.donationBtnText}>💳 {t('profileDonateButton')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.supportSection}>
        <TouchableOpacity style={styles.supportToggleButton} onPress={() => setSupportExpanded(prev => !prev)}>
          <Text style={styles.supportToggleText}>💬 {t('profileImproveButton')}</Text>
          <Text style={styles.supportToggleChevron}>{supportExpanded ? '−' : '+'}</Text>
        </TouchableOpacity>

        {supportExpanded ? (
          <View style={styles.supportPanel}>
            <Text style={styles.supportTitle}>{t('profileImproveTitle')}</Text>
            <Text style={styles.supportSubtitle}>{t('profileImproveSubtitle')}</Text>

            <Text style={styles.label}>{t('profileImproveInputLabel')}</Text>
            <TextInput
              style={[styles.input, styles.multiline, styles.supportInput]}
              value={supportDraft}
              onChangeText={setSupportDraft}
              placeholder={t('profileImproveInputPlaceholder')}
              placeholderTextColor={colors.textSubtle}
              multiline
              maxLength={1500}
            />

            <TouchableOpacity
              style={[styles.supportSendButton, supportSending && styles.buttonDisabled]}
              onPress={handleSendSupportMessage}
              disabled={supportSending}
            >
              <Text style={styles.supportSendText}>{supportSending ? t('profileImproveSending') : t('profileImproveSend')}</Text>
            </TouchableOpacity>

            {supportLoading ? (
              <View style={styles.supportLoadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : supportMessages.length === 0 ? (
              <Text style={styles.supportEmpty}>{t('profileImproveEmpty')}</Text>
            ) : (
              <View style={styles.supportList}>
                {supportMessages.map(item => (
                  <View key={item.id} style={styles.supportCard}>
                    <View style={styles.supportCardHeader}>
                      <View
                        style={[
                          styles.supportStatusBadge,
                          item.status === 'answered'
                            ? styles.supportStatusAnswered
                            : item.status === 'closed'
                              ? styles.supportStatusClosed
                              : styles.supportStatusOpen,
                        ]}
                      >
                        <Text style={styles.supportStatusText}>{getSupportStatusLabel(item.status)}</Text>
                      </View>
                      <Text style={styles.supportDate}>{formatSupportDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.supportMessage}>{item.message}</Text>

                    {item.adminReply ? (
                      <View style={styles.supportReplyBox}>
                        <Text style={styles.supportReplyTitle}>{t('profileImproveReplyTitle')}</Text>
                        <Text style={styles.supportReplyText}>{item.adminReply}</Text>
                        <Text style={styles.supportReplyDate}>{formatSupportDate(item.repliedAt || item.updatedAt)}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={styles.supportDeleteButton}
                      onPress={() => handleDeleteSupportMessage(item.id)}
                      disabled={deletingSupportId === item.id}
                    >
                      <Text style={styles.supportDeleteText}>
                        {deletingSupportId === item.id ? `${t('profileImproveDelete')}...` : t('profileImproveDelete')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>

      <PayPalWebViewModal
        visible={paypalVisible}
        url={paypalUrl}
        title={t('profileDonateTitle')}
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
  topActionsRow: {flexDirection: 'row', gap: 8, marginBottom: spacing.md},
  homeBtn: {
    flex: 1,
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  homeBtnText: {color: colors.text, fontWeight: '700'},
  exitBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  exitBtnText: {color: colors.white, fontWeight: '700'},
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
  supportSection: {
    marginTop: spacing.lg,
  },
  supportToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  supportToggleText: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  supportToggleChevron: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  supportPanel: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  supportSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  supportInput: {
    minHeight: 110,
    marginBottom: 12,
  },
  supportSendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  supportSendText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  supportLoadingRow: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  supportEmpty: {
    marginTop: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  supportList: {
    marginTop: 16,
    gap: 12,
  },
  supportCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  supportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  supportStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  supportStatusOpen: {
    backgroundColor: '#e0f2fe',
  },
  supportStatusAnswered: {
    backgroundColor: '#dcfce7',
  },
  supportStatusClosed: {
    backgroundColor: '#ede9fe',
  },
  supportStatusText: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  supportDate: {
    color: colors.textMuted,
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  supportMessage: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  supportReplyBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  supportReplyTitle: {
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 6,
  },
  supportReplyText: {
    color: colors.textStrong,
    lineHeight: 20,
  },
  supportReplyDate: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 12,
  },
  supportDeleteButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    backgroundColor: '#fee2e2',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  supportDeleteText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  
  // Rating styles
  ratingsSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
