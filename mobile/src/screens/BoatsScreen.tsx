import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { boatService } from '../services/api';
import type { Boat } from '../types';
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';

const BoatsScreen: React.FC = () => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    capacity: '1',
    description: '',
    safetyEquipment: '',
  });

  useEffect(() => {
    loadBoats();
  }, [session?.userId]);

  const loadBoats = async () => {
    try {
      setLoading(true);
      if (!session?.userId) return;
      const boatList = await boatService.getAll(session.userId);
      setBoats(boatList);
    } catch (error) {
      console.error('Error loading boats:', error);
      feedback.error('No se pudieron cargar los barcos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBoat = () => {
    setEditingBoat(null);
    setFormData({
      name: '',
      type: '',
      capacity: '1',
      description: '',
      safetyEquipment: '',
    });
    setShowForm(true);
  };

  const handleEditBoat = (boat: Boat) => {
    setEditingBoat(boat);
    setFormData({
      name: boat.name,
      type: boat.type,
      capacity: boat.capacity.toString(),
      description: boat.description,
      safetyEquipment: boat.safetyEquipment.join(', '),
    });
    setShowForm(true);
  };

  const handleDeleteBoat = (boatId: string) => {
    feedback.confirm('Eliminar barco', '¿Estas seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await boatService.delete(boatId, session?.userId || '');
            setBoats(boats.filter(b => b.id !== boatId));
            feedback.success('Barco eliminado correctamente');
          } catch (error) {
            console.error('Error deleting boat:', error);
            feedback.error('No se pudo eliminar el barco');
          }
        },
      },
    ]);
  };

  const handleSaveBoat = async () => {
    if (!formData.name || !formData.type || !formData.safetyEquipment) {
      feedback.info('Nombre, tipo y equipo de seguridad son obligatorios', 'Campos requeridos');
      return;
    }

    if (!session?.userId) {
      feedback.error('Usuario no autenticado');
      return;
    }

    try {
      const safetyArray = formData.safetyEquipment
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      if (editingBoat) {
        const updated = await boatService.update(editingBoat.id, {
          actorId: session.userId,
          name: formData.name,
          type: formData.type,
          capacity: Number(formData.capacity),
          description: formData.description,
          safetyEquipment: safetyArray,
        });
        setBoats(boats.map(b => (b.id === editingBoat.id ? updated : b)));
        feedback.success('Barco actualizado correctamente');
      } else {
        const newBoat = await boatService.create({
          patronId: session.userId,
          name: formData.name,
          type: formData.type,
          capacity: Number(formData.capacity),
          safetyEquipment: safetyArray,
          description: formData.description,
        });
        setBoats([...boats, newBoat]);
        feedback.success('Barco creado correctamente');
      }

      setShowForm(false);
    } catch (error) {
      console.error('Error saving boat:', error);
      feedback.error('No se pudo guardar el barco');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('boatsTitle')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddBoat}>
          <Text style={styles.addButtonText}>+ {t('boatsAdd')}</Text>
        </TouchableOpacity>
      </View>

      {boats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emoji}>⛵</Text>
          <Text style={styles.emptyTitle}>No hay barcos</Text>
          <Text style={styles.emptyText}>Añade tu primer barco para comenzar</Text>
        </View>
      ) : (
        <FlatList
          data={boats}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <BoatCard
              boat={item}
              onEdit={() => handleEditBoat(item)}
              onDelete={() => handleDeleteBoat(item.id)}
            />
          )}
        />
      )}

      <BoatFormModal
        visible={showForm}
        boat={editingBoat}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSaveBoat}
        onCancel={() => setShowForm(false)}
      />
    </View>
  );
};

interface BoatCardProps {
  boat: Boat;
  onEdit: () => void;
  onDelete: () => void;
}

const BoatCard: React.FC<BoatCardProps> = ({ boat, onEdit, onDelete }) => {
  const safetyDisplay = Array.isArray(boat.safetyEquipment) 
    ? boat.safetyEquipment.join(', ')
    : boat.safetyEquipment;

  return (
    <View style={styles.boatCard}>
      <View style={styles.boatHeader}>
        <Text style={styles.boatName}>{boat.name}</Text>
        <Text style={styles.boatType}>{boat.type}</Text>
      </View>

      <View style={styles.boatDetail}>
        <Text style={styles.detailLabel}>⚡ Capacidad</Text>
        <Text style={styles.detailText}>{boat.capacity} pasajeros</Text>
      </View>

      {boat.length && (
        <View style={styles.boatDetail}>
          <Text style={styles.detailLabel}>📏 Largo</Text>
          <Text style={styles.detailText}>{boat.length}m</Text>
        </View>
      )}

      {boat.description && (
        <View style={styles.boatDetail}>
          <Text style={styles.detailLabel}>📝 Descripción</Text>
          <Text style={styles.detailText}>{boat.description}</Text>
        </View>
      )}

      <View style={styles.boatDetail}>
        <Text style={styles.detailLabel}>🛟 Equipo de Seguridad</Text>
        <Text style={styles.detailTextSafety}>{safetyDisplay}</Text>
      </View>

      <View style={[styles.boatDetail, styles.statusBadge]}>
        <Text style={[styles.detailLabel, { textTransform: 'capitalize' }]}>
          Estado: {boat.status}
        </Text>
      </View>

      <View style={styles.boatActions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface BoatFormModalProps {
  visible: boolean;
  boat: Boat | null;
  formData: any;
  onFormDataChange: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const BoatFormModal: React.FC<BoatFormModalProps> = ({
  visible,
  boat,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>
            {boat ? 'Editar Barco' : 'Añadir Barco'}
          </Text>
          <TouchableOpacity onPress={onSave}>
            <Text style={styles.saveButton}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <FormField
              label="Nombre del barco"
              value={formData.name}
              onChangeText={(text) => onFormDataChange({ ...formData, name: text })}
              placeholder="Ej: Mi Vela Azul"
            />

            <FormField
              label="Tipo de barco"
              value={formData.type}
              onChangeText={(text) => onFormDataChange({ ...formData, type: text })}
              placeholder="Velero, Lancha, Catamarán..."
            />

            <FormField
              label="Capacidad (pasajeros)"
              value={formData.capacity}
              onChangeText={(text) => onFormDataChange({ ...formData, capacity: text })}
              placeholder="Número máximo de pasajeros"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>📝 Descripción</Text>
            <FormField
              label="Descripción del barco"
              value={formData.description}
              onChangeText={(text) => onFormDataChange({ ...formData, description: text })}
              placeholder="Características, comodidades, equipamiento..."
              multiline
            />
          </View>

          <View style={[styles.formSection, styles.safetySection]}>
            <Text style={styles.sectionTitle}>🛟 Equipo de Seguridad (Requerido)</Text>
            <Text style={styles.safetySublabel}>
              Ingresa los items separados por comas (ej: Chalecos x8, Botiquín, Extintor)
            </Text>
            <FormField
              label="Equipo de seguridad"
              value={formData.safetyEquipment}
              onChangeText={(text) => onFormDataChange({ ...formData, safetyEquipment: text })}
              placeholder="Chalecos (8), botiquín, extintores..."
              multiline
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType = 'default',
}) => {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.borderStrong}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  boatCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boatHeader: {
    marginBottom: 12,
  },
  boatName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  boatType: {
    fontSize: 13,
    color: colors.textMuted,
  },
  boatDetail: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  detailTextSafety: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
    lineHeight: 20,
  },
  boatActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formHeader: {
    backgroundColor: colors.surface,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  saveButton: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  formScroll: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  safetySection: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  safetySublabel: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    marginBottom: 8,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  fieldInputMultiline: {
    height: 100,
    paddingTop: 10,
  },
  statusBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderLeftWidth: 0,
  },
});

export default BoatsScreen;
