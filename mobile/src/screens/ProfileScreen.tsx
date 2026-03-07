import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList, Image} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {userService, ratingService, donationService} from '../services/api';
import {RatingStars} from '../components/RatingStars';
import {PayPalWebViewModal} from '../components/PayPalWebViewModal';
import type {UserSkill, Rating} from '../types';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const {session, logout} = useAuth();
  const {t} = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
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

    Alert.alert(
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
              Alert.alert('Gracias', `Donación de €${pendingDonationAmount.toFixed(2)} registrada`);
            } catch (error) {
              Alert.alert('Aviso', 'No pudimos registrar la donación automáticamente');
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
          setAverageRating(ratingsData.averageRating || 0);
          setRatings(Array.isArray(ratingsData.ratings) ? ratingsData.ratings : []);
        } catch (ratingError) {
          console.warn('Error loading ratings:', ratingError);
        } finally {
          setRatingsLoading(false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert(t('alertErrorTitle'), t('profileLoadError'));
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
      await userService.update(session.userId, {
        name: name.trim() || session.name,
        bio: bio.trim(),
        boatName: session.role === 'patron' ? boatName.trim() : undefined,
        boatType: session.role === 'patron' ? `${boatType.trim()}${boatDetails.trim() ? ` · ${boatDetails.trim()}` : ''}` : undefined,
        skills,
      });
      Alert.alert(t('alertOkTitle'), t('profileSaved'));
    } catch (_e) {
      Alert.alert(t('alertErrorTitle'), t('profileLoadError'));
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    Alert.alert(t('profileLogoutTitle'), t('profileLogoutMessage'), [
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
        <ActivityIndicator size="large" color="#0284c7" />
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

      {/* Sección de Ratings */}
      <View style={styles.ratingsSection}>
        <Text style={styles.sectionTitle}>⭐ Puntuación</Text>
        <View style={styles.ratingCard}>
          <View style={styles.ratingHeaderRow}>
            <View style={styles.ratingHeaderLeft}>
              <Text style={styles.ratingTitle}>Mi Puntuación</Text>
              <View style={styles.ratingStarContainer}>
                <RatingStars rating={averageRating} size="lg" />
                <Text style={styles.ratingScore}>{averageRating.toFixed(1)}</Text>
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
                        {new Date(rating.createdAt || '').toLocaleDateString('es-ES')}
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
            Alert.alert(
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
  container: {padding: 20, backgroundColor: '#f8fafc'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc'},
  homeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  homeBtnText: {color: '#0f172a', fontWeight: '700'},
  title: {fontSize: 24, fontWeight: '800', marginBottom: 16, color: '#0f172a'},
  line: {fontSize: 16, marginBottom: 6, color: '#334155'},
  roleLine: {marginBottom: 14},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 6, marginBottom: 10},
  label: {fontSize: 13, color: '#334155', fontWeight: '600', marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
  multiline: {minHeight: 70, textAlignVertical: 'top'},
  levelRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  levelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  levelBtnActive: {borderColor: '#0284c7', backgroundColor: '#e0f2fe'},
  levelText: {color: '#334155', fontWeight: '600', fontSize: 12},
  levelTextActive: {color: '#0369a1'},
  saveButton: {marginTop: 4, backgroundColor: '#0284c7', borderRadius: 10, paddingVertical: 14},
  saveText: {textAlign: 'center', color: '#fff', fontWeight: '700'},
  buttonDisabled: {opacity: 0.6},
  logoutButton: {marginTop: 12, backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 14},
  logoutText: {textAlign: 'center', color: '#fff', fontWeight: '700'},
  
  // Donation styles
  donationSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  donationMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  donationBtn: {
    backgroundColor: '#003087',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  donationBtnText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Rating styles
  ratingsSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#64748b',
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
    color: '#0284c7',
  },
  ratingHeaderRight: {
    alignItems: 'center',
    paddingLeft: 20,
  },
  ratingCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  ratingCountLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  reviewsList: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  reviewsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#0f172a',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});
