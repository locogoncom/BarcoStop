import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {launchImageLibrary, type ImageLibraryOptions} from 'react-native-image-picker';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {RemoteImage} from '../components/RemoteImage';
import {tripService} from '../services/api';
import {colors} from '../theme/colors';
import {getErrorMessage} from '../utils/errors';

type TimeWindow = 'morning' | 'afternoon' | 'night';
type TripKind = 'trip' | 'regatta';

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

const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CreateTripScreen({route}: any) {
  const navigation = useNavigation<any>();
  const {session} = useAuth();
  const {t} = useLanguage();
  const editingTrip = route?.params?.trip || null;
  const isEditing = Boolean(editingTrip?.id || route?.params?.tripId);
  const fixedTripKind = route?.params?.tripKind === 'regatta' || route?.params?.tripKind === 'trip'
    ? route.params.tripKind
    : null;
  const [tripKind, setTripKind] = useState<TripKind>(route?.params?.tripKind === 'regatta' ? 'regatta' : 'trip');
  const [title, setTitle] = useState('');
  const [captainNote, setCaptainNote] = useState('');
  const [boatImageUrl, setBoatImageUrl] = useState('');
  const [boatImageLocalMeta, setBoatImageLocalMeta] = useState<{uri: string; fileName?: string; type?: string} | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(getTodayIsoDate());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('morning');
  const [availableSeats, setAvailableSeats] = useState('4');
  const [price, setPrice] = useState('20');
  const [contributionType, setContributionType] = useState('');
  const [contributionNote, setContributionNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editingTrip) return;
    setTripKind(editingTrip.tripKind === 'regatta' ? 'regatta' : 'trip');
    setTitle(editingTrip.title || '');
    setCaptainNote(editingTrip.captainNote || '');
    setBoatImageUrl(editingTrip.boatImageUrl || '');
    setBoatImageLocalMeta(null);
    setOrigin(editingTrip.origin || '');
    setDestination(editingTrip.destination || '');
    // Asegurarnos de que en la edición solo se vea la FECHA (YYYY-MM-DD), sin hora.
    const rawDate: unknown = editingTrip.departureDate;
    if (typeof rawDate === 'string' && rawDate.trim()) {
      // Admite formatos "YYYY-MM-DD", "YYYY-MM-DD HH:MM", "YYYY-MM-DDTHH:MM:SS"
      const onlyDate = rawDate.split('T')[0].split(' ')[0];
      setDepartureDate(onlyDate || getTodayIsoDate());
    } else {
      setDepartureDate(getTodayIsoDate());
    }
    setTimeWindow(editingTrip.timeWindow || inferWindowFromTime(editingTrip.departureTime));
    setAvailableSeats(String(editingTrip.availableSeats ?? 1));
    setPrice(String(editingTrip.price ?? 0));
    setContributionType(editingTrip.contributionType || '');
    setContributionNote(editingTrip.contributionNote || '');
  }, [editingTrip]);

  const isLocalImageUri = (value: string) => /^(content:\/\/|file:\/\/|ph:\/\/|assets-library:\/\/)/i.test(value.trim());

  const pickBoatImageFromGallery = async () => {
    const isRegattaForm = tripKind === 'regatta';
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 1,
      quality: isRegattaForm ? 0.7 : 0.85,
      maxWidth: isRegattaForm ? 1280 : 1600,
      maxHeight: isRegattaForm ? 1280 : 1600,
    };

    try {
      const response = await launchImageLibrary(options);
      if (response.didCancel) return;

      if (response.errorCode) {
        Alert.alert('Aviso', 'No se pudo abrir la galería');
        return;
      }

      const asset = response.assets?.[0];
      const selectedUri = asset?.uri?.trim();
      if (!selectedUri) {
        Alert.alert('Aviso', 'No se pudo obtener la foto seleccionada');
        return;
      }

      const selectedType = typeof asset?.type === 'string' ? asset.type : undefined;
      const selectedFileName = typeof asset?.fileName === 'string' ? asset.fileName : undefined;
      const selectedFileSize = typeof asset?.fileSize === 'number' ? asset.fileSize : undefined;

      if (selectedType && /image\/hei(c|f)/i.test(selectedType)) {
        Alert.alert('Aviso', 'Formato no compatible. Elige una foto JPG, PNG o WEBP.');
        return;
      }

      const maxFileSize = isRegattaForm ? 2 * 1024 * 1024 : 7 * 1024 * 1024;
      if (selectedFileSize && selectedFileSize > maxFileSize) {
        Alert.alert('Aviso', isRegattaForm ? 'La foto de la regata debe ser pequeña, de hasta 2MB.' : 'La foto es muy pesada. Usa una imagen de hasta 7MB.');
        return;
      }

      setBoatImageUrl(selectedUri);
      setBoatImageLocalMeta({uri: selectedUri, fileName: selectedFileName, type: selectedType});
    } catch {
      Alert.alert('Aviso', isRegattaForm ? 'No se pudo seleccionar la foto de la regata' : 'No se pudo seleccionar la foto del barco');
    }
  };

  const onCreate = async () => {
    const trimmedTitle = title.trim();
    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();
    const seatsValue = Number(availableSeats);
    const priceValue = Number(price);
    const isRegattaForm = tripKind === 'regatta';

    if (!trimmedTitle || !trimmedOrigin || !trimmedDestination) {
      Alert.alert(t('alertMissingTitle'), t('alertMissingMessage'));
      return;
    }

    if (!isRegattaForm && (!Number.isFinite(seatsValue) || seatsValue < 1)) {
      Alert.alert(t('alertInvalidTitle'), t('alertInvalidSeats'));
      return;
    }

    if (!isRegattaForm && (!Number.isFinite(priceValue) || priceValue < 0)) {
      Alert.alert(t('alertInvalidTitle'), t('alertInvalidPrice'));
      return;
    }

    if (!isRegattaForm && priceValue === 0 && !contributionType.trim()) {
      Alert.alert('Contribución requerida', 'Si el precio es 0€, indica al menos un tipo de contribución.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate.trim())) {
      Alert.alert(t('alertInvalidFormatTitle'), 'Usa formato YYYY-MM-DD');
      return;
    }

    try {
      setLoading(true);
      let resolvedBoatImage = boatImageUrl.trim();
      let skippedBoatImageUpload = false;

      if (resolvedBoatImage && isLocalImageUri(resolvedBoatImage) && session?.userId) {
        const meta = boatImageLocalMeta?.uri === resolvedBoatImage ? boatImageLocalMeta : null;
        try {
          const uploadedUrl = await tripService.uploadImage(session.userId, resolvedBoatImage, {
            filename: meta?.fileName,
            mimeType: meta?.type,
            imageKind: isRegattaForm ? 'regatta' : 'trip',
          });
          if (!uploadedUrl) {
            throw new Error(isRegattaForm ? 'No se pudo subir la foto de la regata' : 'No se pudo subir la foto del barco');
          }
          resolvedBoatImage = uploadedUrl;
          setBoatImageUrl(uploadedUrl);
          setBoatImageLocalMeta(null);
        } catch (uploadError: any) {
          const uploadMessage = getErrorMessage(uploadError, isRegattaForm ? 'No se pudo subir la foto de la regata' : 'No se pudo subir la foto del barco');
          if (/foto del barco|foto de la regata|subida de imagen|upload-image/i.test(uploadMessage)) {
            skippedBoatImageUpload = true;
            resolvedBoatImage = '';
            setBoatImageUrl('');
            setBoatImageLocalMeta(null);
          } else {
            throw uploadError;
          }
        }
      }

      if (isEditing && editingTrip?.id) {
        await tripService.update(editingTrip.id, {
          actorId: session?.userId || '',
          tripKind,
          title: trimmedTitle,
          captainNote: captainNote.trim(),
          boatImageUrl: resolvedBoatImage,
          origin: trimmedOrigin,
          destination: trimmedDestination,
          departureDate: departureDate.trim(),
          departureTime: `${WINDOW_TO_TIME[timeWindow]}:00`,
          availableSeats: isRegattaForm ? 0 : seatsValue,
          price: isRegattaForm ? 0 : priceValue,
          timeWindow,
          contributionType: !isRegattaForm && priceValue === 0 ? contributionType.trim() : '',
          contributionNote: !isRegattaForm && priceValue === 0 ? contributionNote.trim() : '',
        });
        Alert.alert(t('alertOkTitle'), isRegattaForm ? 'Regata actualizada correctamente' : 'Viaje actualizado correctamente');
      } else {
        await tripService.create({
          tripKind,
          title: trimmedTitle,
          captainNote: captainNote.trim(),
          boatImageUrl: resolvedBoatImage,
          origin: trimmedOrigin,
          destination: trimmedDestination,
          departureDate: `${departureDate.trim()} ${WINDOW_TO_TIME[timeWindow]}`,
          availableSeats: isRegattaForm ? 0 : seatsValue,
          price: isRegattaForm ? 0 : priceValue,
          patronId: session?.userId || '',
          timeWindow,
          contributionType: !isRegattaForm && priceValue === 0 ? contributionType.trim() : '',
          contributionNote: !isRegattaForm && priceValue === 0 ? contributionNote.trim() : '',
        });
        Alert.alert(t('alertOkTitle'), isRegattaForm ? 'Regata creada correctamente' : t('alertCreateSuccess'));
      }

      if (skippedBoatImageUpload) {
        Alert.alert('Aviso', isRegattaForm ? 'La regata se guardó, pero la foto pequeña no se pudo subir en la API activa.' : 'El viaje se guardó, pero la foto del barco no se pudo subir todavía en la API activa.');
      }
      navigation.goBack();
    } catch (_e: any) {
      Alert.alert(t('alertErrorTitle'), getErrorMessage(_e, t('alertCreateError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => navigation.getParent()?.getParent()?.reset({index: 0, routes: [{name: 'Home'}]})}>
        <Text style={styles.homeBtnText}>🏠 {t('goHome')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isEditing ? (tripKind === 'regatta' ? 'Editar regata' : 'Editar viaje') : (tripKind === 'regatta' ? t('createRegattaTitle') : t('createTripTitle'))}</Text>

      {!fixedTripKind ? (
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, tripKind === 'trip' && styles.modeBtnActive]}
            onPress={() => setTripKind('trip')}
          >
            <Text style={[styles.modeBtnText, tripKind === 'trip' && styles.modeBtnTextActive]}>{t('createTripModeTrip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, tripKind === 'regatta' && styles.modeBtnActive]}
            onPress={() => setTripKind('regatta')}
          >
            <Text style={[styles.modeBtnText, tripKind === 'regatta' && styles.modeBtnTextActive]}>{t('createTripModeRegatta')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TextInput style={styles.input} placeholder={tripKind === 'regatta' ? t('createRegattaTitle') : t('createTripFieldTitle')} placeholderTextColor={colors.textSubtle} value={title} onChangeText={setTitle} />

      <>
        <Text style={styles.label}>{tripKind === 'regatta' ? 'Foto pequeña de la regata (opcional)' : 'Foto del barco'}</Text>
        {tripKind === 'regatta' ? (
          <Text style={styles.helperText}>Solo la sube quien crea la regata. Se reduce antes de enviarla para evitar fallos.</Text>
        ) : null}
        <View style={styles.imageSection}>
          {boatImageUrl ? (
            <RemoteImage
              uri={boatImageUrl}
              style={styles.boatImagePreview}
              fallbackText={tripKind === 'regatta' ? '🏁' : '⛵'}
              fallbackStyle={styles.boatImagePlaceholder}
              fallbackTextStyle={styles.boatImagePlaceholderText}
            />
          ) : (
            <View style={styles.boatImagePlaceholder}>
              <Text style={styles.boatImagePlaceholderText}>{tripKind === 'regatta' ? '🏁' : '⛵'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.galleryBtn} onPress={pickBoatImageFromGallery}>
            <Text style={styles.galleryBtnText}>{boatImageUrl ? 'Cambiar foto' : (tripKind === 'regatta' ? 'Subir foto pequeña' : 'Subir foto del barco')}</Text>
          </TouchableOpacity>
        </View>
      </>

      <Text style={styles.label}>{tripKind === 'regatta' ? 'Descripción de la regata' : 'Descripción breve del viaje'}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder={tripKind === 'regatta' ? 'Describe la regata, normas, recorrido o ambiente' : 'Describe brevemente el ambiente, el barco o los detalles del viaje'}
        placeholderTextColor={colors.textSubtle}
        value={captainNote}
        onChangeText={setCaptainNote}
        multiline
      />

      <TextInput style={styles.input} placeholder={t('createTripFieldOrigin')} placeholderTextColor={colors.textSubtle} value={origin} onChangeText={setOrigin} />

      <TextInput style={styles.input} placeholder={t('createTripFieldDestination')} placeholderTextColor={colors.textSubtle} value={destination} onChangeText={setDestination} />

      <TextInput
        style={styles.input}
        placeholder="Fecha salida (YYYY-MM-DD)"
        placeholderTextColor={colors.textSubtle}
        value={departureDate}
        onChangeText={setDepartureDate}
      />

      <Text style={styles.label}>Franja horaria</Text>
      <View style={styles.windowRow}>
        <TouchableOpacity
          style={[styles.windowBtn, timeWindow === 'morning' && styles.windowBtnActive]}
          onPress={() => setTimeWindow('morning')}
        >
          <Text style={[styles.windowBtnText, timeWindow === 'morning' && styles.windowBtnTextActive]}>🌅 Mañana</Text>
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

      {tripKind !== 'regatta' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('createTripFieldSeats')}
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={availableSeats}
            onChangeText={setAvailableSeats}
          />
          <TextInput
            style={styles.input}
            placeholder={`${t('createTripFieldPrice')} (puede ser 0)`}
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          {Number(price) === 0 ? (
            <>
              <Text style={styles.label}>Contribución esperada</Text>
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
        </>
      ) : null}

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={onCreate}>
        <Text style={styles.buttonText}>
          {loading ? t('createTripSaving') : isEditing ? 'Guardar cambios' : (tripKind === 'regatta' ? t('createRegattaSave') : t('createTripSave'))}
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
  modeRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  modeBtnActive: {borderColor: colors.primary, backgroundColor: '#e0f2fe'},
  modeBtnText: {color: colors.textStrong, fontWeight: '700'},
  modeBtnTextActive: {color: colors.primary},
  label: {fontSize: 13, color: colors.textStrong, fontWeight: '600', marginBottom: 6},
  helperText: {fontSize: 12, color: colors.textSubtle, marginBottom: 8},
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
  imageSection: {marginBottom: 12},
  boatImagePreview: {width: '100%', height: 190, borderRadius: 12, marginBottom: 10, backgroundColor: colors.border},
  boatImagePlaceholder: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boatImagePlaceholderText: {fontSize: 42},
  galleryBtn: {backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center'},
  galleryBtnText: {color: colors.white, fontWeight: '700'},
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
