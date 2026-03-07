import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {tripService} from '../services/api';
import {colors} from '../theme/colors';

type TimeWindow = 'morning' | 'afternoon' | 'night';

const WINDOW_TO_TIME: Record<TimeWindow, string> = {
  morning: '09:00',
  afternoon: '15:00',
  night: '20:00',
};

const inferWindowFromTime = (value: unknown): TimeWindow => {
  if (typeof value !== 'string') return 'morning';
  const hour = Number(value.slice(0, 2));
  if (!Number.isFinite(hour)) return 'morning';
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  return 'night';
};

export default function CreateTripScreen({route}: any) {
  const navigation = useNavigation<any>();
  const {session} = useAuth();
  const {t} = useLanguage();
  const editingTrip = route?.params?.trip || null;
  const isEditing = Boolean(editingTrip?.id || route?.params?.tripId);
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('2026-03-10');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('morning');
  const [availableSeats, setAvailableSeats] = useState('4');
  const [price, setPrice] = useState('20');
  const [contributionType, setContributionType] = useState('');
  const [contributionNote, setContributionNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editingTrip) return;
    setTitle(editingTrip.title || '');
    setOrigin(editingTrip.origin || '');
    setDestination(editingTrip.destination || '');
    setDepartureDate(editingTrip.departureDate || '2026-03-10');
    setTimeWindow(editingTrip.timeWindow || inferWindowFromTime(editingTrip.departureTime));
    setAvailableSeats(String(editingTrip.availableSeats ?? 1));
    setPrice(String(editingTrip.price ?? 0));
    setContributionType(editingTrip.contributionType || '');
    setContributionNote(editingTrip.contributionNote || '');
  }, [editingTrip]);

  const onCreate = async () => {
    const trimmedTitle = title.trim();
    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();
    const seatsValue = Number(availableSeats);
    const priceValue = Number(price);

    if (!trimmedTitle || !trimmedOrigin || !trimmedDestination) {
      Alert.alert(t('alertMissingTitle'), t('alertMissingMessage'));
      return;
    }

    if (!Number.isFinite(seatsValue) || seatsValue < 1) {
      Alert.alert(t('alertInvalidTitle'), t('alertInvalidSeats'));
      return;
    }

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      Alert.alert(t('alertInvalidTitle'), t('alertInvalidPrice'));
      return;
    }

    if (priceValue === 0 && !contributionType.trim()) {
      Alert.alert('Contribucion requerida', 'Si el precio es 0€, indica al menos un tipo de contribucion.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate.trim())) {
      Alert.alert(t('alertInvalidFormatTitle'), 'Usa formato YYYY-MM-DD');
      return;
    }

    try {
      setLoading(true);
      if (isEditing && editingTrip?.id) {
        await tripService.update(editingTrip.id, {
          actorId: session?.userId || '',
          title: trimmedTitle,
          origin: trimmedOrigin,
          destination: trimmedDestination,
          departureDate: departureDate.trim(),
          departureTime: `${WINDOW_TO_TIME[timeWindow]}:00`,
          availableSeats: seatsValue,
          price: priceValue,
          timeWindow,
          contributionType: priceValue === 0 ? contributionType.trim() : '',
          contributionNote: priceValue === 0 ? contributionNote.trim() : '',
        });
        Alert.alert(t('alertOkTitle'), 'Viaje actualizado correctamente');
      } else {
        await tripService.create({
          title: trimmedTitle,
          origin: trimmedOrigin,
          destination: trimmedDestination,
          departureDate: `${departureDate.trim()} ${WINDOW_TO_TIME[timeWindow]}`,
          availableSeats: seatsValue,
          price: priceValue,
          patronId: session?.userId || '',
          timeWindow,
          contributionType: priceValue === 0 ? contributionType.trim() : '',
          contributionNote: priceValue === 0 ? contributionNote.trim() : '',
        });
        Alert.alert(t('alertOkTitle'), t('alertCreateSuccess'));
      }
      navigation.goBack();
    } catch (_e: any) {
      const backendMessage = _e?.response?.data?.error;
      Alert.alert(t('alertErrorTitle'), backendMessage || t('alertCreateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeBtnText}>🏠 {t('goHome')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isEditing ? 'Editar viaje' : t('createTripTitle')}</Text>

      <TextInput style={styles.input} placeholder={t('createTripFieldTitle')} value={title} onChangeText={setTitle} />

      <TextInput style={styles.input} placeholder={t('createTripFieldOrigin')} value={origin} onChangeText={setOrigin} />

      <TextInput style={styles.input} placeholder={t('createTripFieldDestination')} value={destination} onChangeText={setDestination} />

      <TextInput
        style={styles.input}
        placeholder="Fecha salida (YYYY-MM-DD)"
        value={departureDate}
        onChangeText={setDepartureDate}
      />

      <Text style={styles.label}>Franja horaria</Text>
      <View style={styles.windowRow}>
        <TouchableOpacity
          style={[styles.windowBtn, timeWindow === 'morning' && styles.windowBtnActive]}
          onPress={() => setTimeWindow('morning')}
        >
          <Text style={[styles.windowBtnText, timeWindow === 'morning' && styles.windowBtnTextActive]}>🌅 Manana</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.windowBtn, timeWindow === 'afternoon' && styles.windowBtnActive]}
          onPress={() => setTimeWindow('afternoon')}
        >
          <Text style={[styles.windowBtnText, timeWindow === 'afternoon' && styles.windowBtnTextActive]}>☀️ Tarde</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.windowBtn, timeWindow === 'night' && styles.windowBtnActive]}
          onPress={() => setTimeWindow('night')}
        >
          <Text style={[styles.windowBtnText, timeWindow === 'night' && styles.windowBtnTextActive]}>🌙 Noche</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder={t('createTripFieldSeats')} keyboardType="numeric" value={availableSeats} onChangeText={setAvailableSeats} />

      <TextInput
        style={styles.input}
        placeholder={`${t('createTripFieldPrice')} (puede ser 0)`}
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      {Number(price) === 0 ? (
        <>
          <Text style={styles.label}>Contribucion esperada</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: marinero, cocina, guardia, limpieza"
            value={contributionType}
            onChangeText={setContributionType}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Detalles opcionales"
            value={contributionNote}
            onChangeText={setContributionNote}
            multiline
          />
        </>
      ) : null}

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={onCreate}>
        <Text style={styles.buttonText}>
          {loading ? t('createTripSaving') : isEditing ? 'Guardar cambios' : t('createTripSave')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, backgroundColor: colors.background},
  homeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  homeBtnText: {color: colors.text, fontWeight: '700'},
  title: {fontSize: 24, fontWeight: '800', marginBottom: 14, color: colors.text},
  label: {fontSize: 13, color: colors.textStrong, fontWeight: '600', marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  multiline: {minHeight: 80, textAlignVertical: 'top'},
  windowRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  windowBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  windowBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#e0f2fe',
  },
  windowBtnText: {color: colors.textStrong, fontWeight: '600', fontSize: 12},
  windowBtnTextActive: {color: colors.primary},
  button: {backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, marginTop: 4},
  buttonDisabled: {opacity: 0.6},
  buttonText: {textAlign: 'center', color: colors.white, fontWeight: '700'},
});
