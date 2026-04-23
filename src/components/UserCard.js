import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from './ui/Card';
import { RatingStars } from './RatingStars';
import { MapPin } from 'lucide-react';
export function UserCard({ user, onClick }) {
    const handleClick = () => {
        if (onClick)
            onClick();
    };
    return (_jsx(Card, { className: "cursor-pointer hover:shadow-md transition-all", onClick: handleClick, children: _jsxs(CardContent, { className: "pt-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold", children: user.name.charAt(0).toUpperCase() }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium text-gray-900", children: user.name }), user.role === 'patron' && user.boatName && (_jsxs("p", { className: "text-sm text-gray-600 flex items-center gap-1", children: [_jsx(MapPin, { size: 14 }), user.boatName] })), user.bio && _jsx("p", { className: "text-sm text-gray-500 mt-1", children: user.bio }), _jsxs("div", { className: "mt-2", children: [_jsx(RatingStars, { rating: user.averageRating || 0, readonly: true, size: "sm" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: user.averageRating?.toFixed(1) || 'Sin valoraciones' })] })] })] }), user.skills && user.skills.length > 0 && (_jsxs("div", { className: "mt-3 pt-3 border-t border-gray-200", children: [_jsx("p", { className: "text-xs font-medium text-gray-600 mb-2", children: "Habilidades:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: user.skills.map((skill) => (_jsx("span", { className: "inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded", children: skill.name }, skill.name))) })] }))] }) }));
}
