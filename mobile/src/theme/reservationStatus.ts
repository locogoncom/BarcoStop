import {colors} from './colors';

export const getReservationStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return colors.accent;
    case 'approved':
    case 'confirmed':
      return colors.success;
    case 'rejected':
      return colors.danger;
    case 'cancelled':
      return '#6b7280';
    default:
      return colors.primary;
  }
};

export const getReservationStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return '🟡 Pendiente';
    case 'approved':
    case 'confirmed':
      return '✅ Aceptada';
    case 'rejected':
      return '❌ Rechazada';
    case 'cancelled':
      return '⛔ Cancelada';
    default:
      return status;
  }
};
