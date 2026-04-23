import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Share2, MapPin } from 'lucide-react';
export function TripTrackingCard({ tracking, trip, user, onShare, onStatusUpdate, }) {
    const getStatusLabel = (status) => {
        const labels = {
            started: 'Viaje iniciado',
            in_progress: 'En trayecto',
            completed: 'Viaje completado',
        };
        return labels[status];
    };
    const getStatusColor = (status) => {
        const colors = {
            started: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
        };
        return colors[status];
    };
    return (_jsx(Card, { children: _jsx(CardContent, { className: "pt-4", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-bold text-gray-900", children: [trip.route.origin, " \u2192 ", trip.route.destination] }), _jsxs("p", { className: "text-sm text-gray-600 flex items-center gap-1 mt-1", children: [_jsx(MapPin, { size: 14 }), "Con ", user.name] })] }), _jsx("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tracking.status)}`, children: getStatusLabel(tracking.status) })] }), tracking.currentPosition && (_jsxs("p", { className: "text-sm text-gray-600", children: ["\uD83D\uDCCD ", tracking.currentPosition] })), _jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-gray-200", children: [_jsxs("div", { className: "text-sm text-gray-500", children: [tracking.sharedWith.length, " personas viendo este viaje"] }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: onShare, className: "flex items-center gap-2", children: [_jsx(Share2, { size: 16 }), "Compartir"] })] }), onStatusUpdate && (_jsxs("div", { className: "flex gap-2 pt-2", children: [tracking.status !== 'started' && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => onStatusUpdate('started'), className: "flex-1", children: "Iniciar" })), tracking.status !== 'in_progress' && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => onStatusUpdate('in_progress'), className: "flex-1", children: "En trayecto" })), tracking.status !== 'completed' && (_jsx(Button, { size: "sm", onClick: () => onStatusUpdate('completed'), className: "flex-1", children: "Completar" }))] }))] }) }) }));
}
