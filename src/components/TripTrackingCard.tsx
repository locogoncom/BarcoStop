import React from 'react';
import { TripTracking, Trip, User } from '../types';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Share2, MapPin } from 'lucide-react';

interface TripTrackingProps {
  tracking: TripTracking;
  trip: Trip;
  user: User;
  onShare?: () => void;
  onStatusUpdate?: (status: TripTracking['status']) => void;
}

export function TripTrackingCard({
  tracking,
  trip,
  user,
  onShare,
  onStatusUpdate,
}: TripTrackingProps) {
  const getStatusLabel = (status: TripTracking['status']) => {
    const labels = {
      started: 'Viaje iniciado',
      in_progress: 'En trayecto',
      completed: 'Viaje completado',
    };
    return labels[status];
  };

  const getStatusColor = (status: TripTracking['status']) => {
    const colors = {
      started: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status];
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900">
                {trip.route.origin} → {trip.route.destination}
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin size={14} />
                Con {user.name}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor(tracking.status)
            }`}>
              {getStatusLabel(tracking.status)}
            </span>
          </div>

          {tracking.currentPosition && (
            <p className="text-sm text-gray-600">
              📍 {tracking.currentPosition}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {tracking.sharedWith.length} personas viendo este viaje
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="flex items-center gap-2"
            >
              <Share2 size={16} />
              Compartir
            </Button>
          </div>

          {onStatusUpdate && (
            <div className="flex gap-2 pt-2">
              {tracking.status !== 'started' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusUpdate('started')}
                  className="flex-1"
                >
                  Iniciar
                </Button>
              )}
              {tracking.status !== 'in_progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusUpdate('in_progress')}
                  className="flex-1"
                >
                  En trayecto
                </Button>
              )}
              {tracking.status !== 'completed' && (
                <Button
                  size="sm"
                  onClick={() => onStatusUpdate('completed')}
                  className="flex-1"
                >
                  Completar
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
