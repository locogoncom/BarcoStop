import { Reservation, Trip, User } from '../types';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { RatingStars } from './RatingStars';

interface ReservationCardProps {
  reservation: Reservation;
  trip: Trip;
  user: User;
  onAccept?: () => void;
  onReject?: () => void;
  onRate?: (rating: number, comment: string) => void;
}

export function ReservationCard({
  reservation,
  trip,
  user,
  onAccept,
  onReject,
  onRate,
}: ReservationCardProps) {
  const getStatusLabel = (status: Reservation['status']) => {
    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
    };
    return labels[status];
  };

  const getStatusColor = (status: Reservation['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {trip.route.origin} → {trip.route.destination}
              </p>
              {user.bio && (
                <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor(reservation.status)
            }`}>
              {getStatusLabel(reservation.status)}
            </span>
          </div>

          {user.skills && user.skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Habilidades:</p>
              <div className="flex flex-wrap gap-1">
                {user.skills.map((skill) => (
                  <span
                    key={skill.name}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <RatingStars rating={user.averageRating || 0} readonly size="sm" />
            <p className="text-sm text-gray-600">
              {user.averageRating?.toFixed(1) || 'Sin valoraciones'}
            </p>
          </div>

          {reservation.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              {onReject && (
                <Button variant="destructive" size="sm" onClick={onReject} className="flex-1">
                  Rechazar
                </Button>
              )}
              {onAccept && (
                <Button size="sm" onClick={onAccept} className="flex-1">
                  Aceptar
                </Button>
              )}
            </div>
          )}

          {reservation.status === 'accepted' && onRate && (
            <div className="pt-2 space-y-2">
              <p className="text-sm font-medium text-gray-900">Califica este viaje:</p>
              <RatingStars rating={0} onRate={(rating) => onRate(rating, '')} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
