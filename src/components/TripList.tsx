import { useState } from 'react';
import { Trip, User, Reservation } from '../types';
import { TripCard } from './TripCard';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Plus, MapPin } from 'lucide-react';

interface TripListProps {
  trips: Trip[];
  users: User[];
  currentUserId: string;
  onCreateTrip?: () => void;
  onReserve?: (tripId: string) => void;
  onChat?: (patronId: string) => void;
  reservations?: Reservation[];
}

export function TripList({
  trips,
  users,
  currentUserId,
  onCreateTrip,
  onReserve,
  onChat,
  reservations = [],
}: TripListProps) {
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const filteredTrips = trips.filter((trip) => {
    const matchOrigin = trip.route.origin
      .toLowerCase()
      .includes(searchOrigin.toLowerCase());
    const matchDestination = trip.route.destination
      .toLowerCase()
      .includes(searchDestination.toLowerCase());
    const matchDate = !searchDate || trip.route.departureDate.includes(searchDate);
    return matchOrigin && matchDestination && matchDate;
  });

  const getUserById = (id: string) => users.find((u) => u.id === id);
  const currentUser = getUserById(currentUserId);
  const isPatron = currentUser?.role === 'patron';

  const userTrips = isPatron
    ? trips.filter((t) => t.patronId === currentUserId)
    : filteredTrips;

  const getReservedTripIds = () => {
    return reservations
      .filter((r) => r.travelerId === currentUserId && r.status !== 'rejected')
      .map((r) => r.tripId);
  };

  const reservedTripIds = getReservedTripIds();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isPatron ? 'Mis Viajes' : 'Buscar Viajes'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isPatron
              ? 'Gestiona tu barco y tus viajes'
              : 'Encuentra el siguiente viaje perfecto'}
          </p>
        </div>
        {isPatron && (
          <Button onClick={onCreateTrip} className="flex items-center gap-2">
            <Plus size={20} />
            Nuevo viaje
          </Button>
        )}
      </div>

      {/* Search filters */}
      {!isPatron && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  De
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Ciudad origen"
                    value={searchOrigin}
                    onChange={(e) => setSearchOrigin(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  A
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Ciudad destino"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <Input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trips list */}
      <div className="space-y-4">
        {userTrips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">
                {isPatron ? 'No tienes viajes publicados' : 'No se encontraron viajes'}
              </p>
              {isPatron && (
                <Button onClick={onCreateTrip}>Publicar tu primer viaje</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          userTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              patron={getUserById(trip.patronId)}
              onReserve={
                !isPatron && !reservedTripIds.includes(trip.id)
                  ? () => onReserve?.(trip.id)
                  : undefined
              }
              onChat={
                !isPatron ? () => onChat?.(trip.patronId) : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
