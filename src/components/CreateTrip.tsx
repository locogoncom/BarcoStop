import React, { useState } from 'react';
import { Trip } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';

interface CreateTripProps {
  onCreate: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  patronId: string;
}

type TimeWindow = 'morning' | 'afternoon' | 'night';

const WINDOW_TO_TIME: Record<TimeWindow, string> = {
  morning: '09:00',
  afternoon: '15:00',
  night: '20:00',
};

export function CreateTrip({ onCreate, onCancel, patronId }: CreateTripProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('morning');
  const [description, setDescription] = useState('');
  const [availableSeats, setAvailableSeats] = useState('1');
  const [cost, setCost] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin.trim() || !destination.trim() || !departureDate) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const newTrip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> = {
      patronId,
      route: {
        origin: origin.trim(),
        destination: destination.trim(),
        departureDate,
        departureTime: WINDOW_TO_TIME[timeWindow],
      },
      description: description.trim(),
      availableSeats: parseInt(availableSeats) || 1,
      cost: parseFloat(cost) || 0,
    };

    onCreate(newTrip);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">Publicar un nuevo viaje</h2>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origen *
                </label>
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ej: Barcelona"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destino *
                </label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ej: Ibiza"
                  required
                />
              </div>
            </div>

            <div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de salida *
                </label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Franja horaria *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTimeWindow('morning')}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    timeWindow === 'morning'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  Manana
                </button>
                <button
                  type="button"
                  onClick={() => setTimeWindow('afternoon')}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    timeWindow === 'afternoon'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  Tarde
                </button>
                <button
                  type="button"
                  onClick={() => setTimeWindow('night')}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    timeWindow === 'night'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  Noche
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitios disponibles
                </label>
                <Input
                  type="number"
                  min="1"
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coste por persona (€)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del viaje
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cuéntanos sobre el viaje, el barco, el itinerario..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Publicar viaje
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
