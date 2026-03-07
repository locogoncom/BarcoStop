import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {tripService} from '../services/api';

export default function CreateTripScreen({route}: any) {
  const navigation = useNavigation<any>();
  const {session} = useAuth();
  const {t} = useLanguage();
  const editingTrip = route?.params?.trip || null;
  const isEditing = Boolean(editingTrip?.id || route?.params?.tripId);
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('2026-03-10 10:00');
  const [availableSeats, setAvailableSeats] = useState('4');
  const [price, setPrice] = useState('20');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editingTrip) return;
    setTitle(editingTrip.title || '');
    setOrigin(editingTrip.origin || '');
    setDestination(editingTrip.destination || '');
    const dateText = editingTrip.departureDate || '2026-03-10';
    const timeText = editingTrip.departureTime || '10:00';
    setDepartureDate(`${dateText} ${timeText}`.trim());
    setAvailableSeats(String(editingTrip.availableSeats ?? 1));
    setPrice(String(editingTrip.price ?? 0));
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

    if (!/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(departureDate.trim())) {
      Alert.alert(t('alertInvalidFormatTitle'), t('alertInvalidFormatMessage'));
      return;
    }

    try {
      setLoading(true);
      if (isEditing && editingTrip?.id) {
        const [datePart, timePart] = departureDate.trim().split(' ');
        await tripService.update(editingTrip.id, {
          actorId: session?.userId || '',
          title: trimmedTitle,
          origin: trimmedOrigin,
          destination: trimmedDestination,
          departureDate: datePart,
          departureTime: timePart || '10:00:00',
          availableSeats: seatsValue,
          price: priceValue,
        });
        Alert.alert(t('alertOkTitle'), 'Viaje actualizado correctamente');
      } else {
        await tripService.create({
          title: trimmedTitle,
          origin: trimmedOrigin,
          destination: trimmedDestination,
          departureDate: departureDate.trim(),
          availableSeats: seatsValue,
          price: priceValue,
          patronId: session?.userId || '',
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

      <TextInput style={styles.input} placeholder={t('createTripFieldDate')} value={departureDate} onChangeText={setDepartureDate} />

      <TextInput style={styles.input} placeholder={t('createTripFieldSeats')} keyboardType="numeric" value={availableSeats} onChangeText={setAvailableSeats} />

      <TextInput style={styles.input} placeholder={t('createTripFieldPrice')} keyboardType="numeric" value={price} onChangeText={setPrice} />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={onCreate}>
        <Text style={styles.buttonText}>
          {loading ? t('createTripSaving') : isEditing ? 'Guardar cambios' : t('createTripSave')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, backgroundColor: '#f8fafc'},
  homeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  homeBtnText: {color: '#0f172a', fontWeight: '700'},
  title: {fontSize: 24, fontWeight: '800', marginBottom: 14, color: '#0f172a'},
  label: {fontSize: 13, color: '#334155', fontWeight: '600', marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  button: {backgroundColor: '#0284c7', borderRadius: 10, paddingVertical: 14, marginTop: 4},
  buttonDisabled: {opacity: 0.6},
  buttonText: {textAlign: 'center', color: '#fff', fontWeight: '700'},
});
