import { Trip, User } from '../types';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { RatingStars } from './RatingStars';
import { MapPin, Users, DollarSign } from 'lucide-react';

interface TripCardProps {
  trip: Trip;
  patron?: User | null;
  onReserve?: () => void;
  onChat?: () => void;
  onViewDetails?: () => void;
}

export function TripCard({ trip, patron, onReserve, onChat, onViewDetails }: TripCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <MapPin size={16} />
              <span>{trip.route.origin} → {trip.route.destination}</span>
            </div>
            <p className="text-xs text-gray-500">
              {new Date(trip.route.departureDate).toLocaleDateString('es-ES')} a las{' '}
              {trip.route.departureTime}
            </p>
          </div>
          {patron && (
            <div className="ml-4 text-right">
              <p className="font-medium text-sm text-gray-900">{patron.name}</p>
              {patron.boatName && (
                <p className="text-xs text-gray-500">{patron.boatName}</p>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {trip.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{trip.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{trip.availableSeats}</span>
              <span className="text-xs text-gray-500">sitios</span>
            </div>
            {trip.cost > 0 && (
              <div className="flex items-center gap-1">
                <DollarSign size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{trip.cost}€</span>
              </div>
            )}
          </div>

          {patron && (
            <RatingStars
              rating={patron.averageRating || 0}
              readonly
              size="sm"
            />
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {onChat && (
            <Button variant="outline" size="sm" onClick={onChat} className="flex-1">
              Contactar
            </Button>
          )}
          {onReserve && (
            <Button size="sm" onClick={onReserve} className="flex-1">
              Reservar
            </Button>
          )}
          {onViewDetails && !onReserve && (
            <Button size="sm" onClick={onViewDetails} className="flex-1">
              Ver detalles
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
