import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RatingStars } from './RatingStars';

interface RatingModalProps {
  visible: boolean;
  userName: string;
  role: 'captain' | 'traveler';
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  userName,
  role,
  onSubmit,
  onCancel,
}) => {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      Alert.alert('Requerido', 'Por favor selecciona una calificación');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(selectedRating, comment);
      // Reset form
      setSelectedRating(0);
      setComment('');
    } catch (error) {
      Alert.alert('Error', 'Error al enviar la calificación. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRating(0);
    setComment('');
    onCancel();
  };

  const roleLabel = role === 'captain' ? 'Capitán' : 'Viajero';
  const prompt = role === 'captain' 
    ? `¿Cómo fue tu experiencia con el capitán ${userName}?`
    : `¿Cómo fue tu experiencia con el viajero ${userName}?`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Calificar viaje</Text>
          
          <Text style={styles.prompt}>{prompt}</Text>
          
          <View style={styles.ratingContainer}>
            <RatingStars
              rating={selectedRating}
              size="lg"
              interactive={true}
              onRatingChange={setSelectedRating}
            />
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Comentario (opcional)"
            placeholderTextColor="#94a3b8"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isLoading}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, !selectedRating && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading || selectedRating === 0}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar calificación</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  prompt: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  ratingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 20,
    maxHeight: 120,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  cancelButtonText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#0284c7',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
