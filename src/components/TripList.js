import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { TripCard } from './TripCard';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Plus, MapPin } from 'lucide-react';
export function TripList({ trips, users, currentUserId, onCreateTrip, onReserve, onChat, reservations = [], }) {
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
    const getUserById = (id) => users.find((u) => u.id === id);
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: isPatron ? 'Mis Viajes' : 'Buscar Viajes' }), _jsx("p", { className: "text-gray-600 mt-1", children: isPatron
                                    ? 'Gestiona tu barco y tus viajes'
                                    : 'Encuentra el siguiente viaje perfecto' })] }), isPatron && (_jsxs(Button, { onClick: onCreateTrip, className: "flex items-center gap-2", children: [_jsx(Plus, { size: 20 }), "Nuevo viaje"] }))] }), !isPatron && (_jsx(Card, { children: _jsx(CardContent, { className: "pt-4", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "De" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { size: 16, className: "absolute left-3 top-3 text-gray-400" }), _jsx(Input, { placeholder: "Ciudad origen", value: searchOrigin, onChange: (e) => setSearchOrigin(e.target.value), className: "pl-9" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "A" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { size: 16, className: "absolute left-3 top-3 text-gray-400" }), _jsx(Input, { placeholder: "Ciudad destino", value: searchDestination, onChange: (e) => setSearchDestination(e.target.value), className: "pl-9" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Fecha" }), _jsx(Input, { type: "date", value: searchDate, onChange: (e) => setSearchDate(e.target.value) })] })] }) }) })), _jsx("div", { className: "space-y-4", children: userTrips.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx("p", { className: "text-gray-500 mb-4", children: isPatron ? 'No tienes viajes publicados' : 'No se encontraron viajes' }), isPatron && (_jsx(Button, { onClick: onCreateTrip, children: "Publicar tu primer viaje" }))] }) })) : (userTrips.map((trip) => (_jsx(TripCard, { trip: trip, patron: getUserById(trip.patronId), onReserve: !isPatron && !reservedTripIds.includes(trip.id)
                        ? () => onReserve?.(trip.id)
                        : undefined, onChat: !isPatron ? () => onChat?.(trip.patronId) : undefined }, trip.id)))) })] }));
}
