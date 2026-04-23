import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Heart } from 'lucide-react';
const PAYPAL_DONATION_URL = 'https://paypal.me/BarcoStop/2.50EUR';
export function Donate({ onClose }) {
    const handlePayPalClick = () => {
        window.open(PAYPAL_DONATION_URL, '_blank');
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: _jsx(Card, { className: "w-full max-w-md", children: _jsxs(CardContent, { className: "pt-6 space-y-4 text-center", children: [_jsx(Heart, { size: 48, className: "mx-auto text-red-500 fill-red-500" }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Invitaci\u00F3n simb\u00F3lica \u2014 Apoya BarcoStop" }), _jsx("p", { className: "text-gray-600", children: "Tu donaci\u00F3n nos ayuda a mejorar la plataforma y conectar a m\u00E1s navegantes alrededor del mundo." })] }), _jsx("div", { className: "space-y-2 py-4", children: _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("p", { className: "font-medium", children: "\uD83D\uDCA1 \u00BFC\u00F3mo usamos tu apoyo?" }), _jsxs("ul", { className: "mt-2 text-left space-y-1", children: [_jsx("li", { children: "\u2728 Desarrollo de nuevas funciones" }), _jsx("li", { children: "\uD83D\uDD12 Seguridad y protecci\u00F3n de datos" }), _jsx("li", { children: "\uD83D\uDCF1 Mejor experiencia en la app" }), _jsx("li", { children: "\uD83C\uDF0D Expansi\u00F3n a nuevas regiones" })] })] }) }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx(Button, { onClick: handlePayPalClick, className: "flex-1 flex items-center justify-center gap-2", children: "\uD83D\uDC99 Invitaci\u00F3n simb\u00F3lica" }), _jsx(Button, { variant: "outline", onClick: onClose, className: "flex-1", children: "Despu\u00E9s" })] }), _jsxs("p", { className: "text-xs text-gray-500", children: ["El sistema de donaciones es completamente opcional.", _jsx("br", {}), "En el futuro cobraremos una comisi\u00F3n simb\u00F3lica por reservas."] })] }) }) }));
}
