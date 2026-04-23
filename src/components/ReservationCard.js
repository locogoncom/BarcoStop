import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { RatingStars } from './RatingStars';
export function ReservationCard({ reservation, trip, user, onAccept, onReject, onRate, }) {
    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pendiente',
            accepted: 'Aceptada',
            rejected: 'Rechazada',
        };
        return labels[status];
    };
    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return colors[status];
    };
    return (_jsx(Card, { children: _jsx(CardContent, { className: "pt-4", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-gray-900", children: user.name }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: [trip.route.origin, " \u2192 ", trip.route.destination] }), user.bio && (_jsx("p", { className: "text-sm text-gray-500 mt-1", children: user.bio }))] }), _jsx("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`, children: getStatusLabel(reservation.status) })] }), user.skills && user.skills.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-600 mb-2", children: "Habilidades:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: user.skills.map((skill) => (_jsx("span", { className: "inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded", children: skill.name }, skill.name))) })] })), _jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-gray-200", children: [_jsx(RatingStars, { rating: user.averageRating || 0, readonly: true, size: "sm" }), _jsx("p", { className: "text-sm text-gray-600", children: user.averageRating?.toFixed(1) || 'Sin valoraciones' })] }), reservation.status === 'pending' && (_jsxs("div", { className: "flex gap-2 pt-2", children: [onReject && (_jsx(Button, { variant: "destructive", size: "sm", onClick: onReject, className: "flex-1", children: "Rechazar" })), onAccept && (_jsx(Button, { size: "sm", onClick: onAccept, className: "flex-1", children: "Aceptar" }))] })), reservation.status === 'accepted' && onRate && (_jsxs("div", { className: "pt-2 space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Califica este viaje:" }), _jsx(RatingStars, { rating: 0, onRate: (rating) => onRate(rating, '') })] }))] }) }) }));
}
