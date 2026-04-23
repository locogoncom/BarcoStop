import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
const WINDOW_TO_TIME = {
    morning: '09:00',
    afternoon: '15:00',
    night: '20:00',
};
export function CreateTrip({ onCreate, onCancel, patronId }) {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [timeWindow, setTimeWindow] = useState('morning');
    const [description, setDescription] = useState('');
    const [availableSeats, setAvailableSeats] = useState('1');
    const [cost, setCost] = useState('0');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!origin.trim() || !destination.trim() || !departureDate) {
            alert('Por favor completa los campos obligatorios');
            return;
        }
        const newTrip = {
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
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: _jsxs(Card, { className: "w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsx(CardHeader, { children: _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Publicar un nuevo viaje" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Origen *" }), _jsx(Input, { value: origin, onChange: (e) => setOrigin(e.target.value), placeholder: "Ej: Barcelona", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Destino *" }), _jsx(Input, { value: destination, onChange: (e) => setDestination(e.target.value), placeholder: "Ej: Ibiza", required: true })] })] }), _jsx("div", { children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Fecha de salida *" }), _jsx(Input, { type: "date", value: departureDate, onChange: (e) => setDepartureDate(e.target.value), required: true })] }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Franja horaria *" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsx("button", { type: "button", onClick: () => setTimeWindow('morning'), className: `rounded-lg border px-3 py-2 text-sm font-semibold ${timeWindow === 'morning'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 bg-white text-gray-700'}`, children: "Manana" }), _jsx("button", { type: "button", onClick: () => setTimeWindow('afternoon'), className: `rounded-lg border px-3 py-2 text-sm font-semibold ${timeWindow === 'afternoon'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 bg-white text-gray-700'}`, children: "Tarde" }), _jsx("button", { type: "button", onClick: () => setTimeWindow('night'), className: `rounded-lg border px-3 py-2 text-sm font-semibold ${timeWindow === 'night'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 bg-white text-gray-700'}`, children: "Noche" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Sitios disponibles" }), _jsx(Input, { type: "number", min: "1", value: availableSeats, onChange: (e) => setAvailableSeats(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Coste por persona (\u20AC)" }), _jsx(Input, { type: "number", min: "0", step: "0.5", value: cost, onChange: (e) => setCost(e.target.value) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descripci\u00F3n del viaje" }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Cu\u00E9ntanos sobre el viaje, el barco, el itinerario...", rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx(Button, { type: "submit", className: "flex-1", children: "Publicar viaje" }), _jsx(Button, { type: "button", variant: "outline", onClick: onCancel, className: "flex-1", children: "Cancelar" })] })] }) })] }) }));
}
