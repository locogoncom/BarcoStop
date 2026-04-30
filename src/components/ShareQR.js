import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Download, Copy, X, Share2 } from 'lucide-react';
export function ShareQR({ onClose, appUrl }) {
    const url = appUrl || 'https://barcostop.net/qr';
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;
    const qrImageSrc = '/assets/http_www_barcostop_net_qr.png';
    const handleDownload = async () => {
        try {
            const link = document.createElement('a');
            link.href = qrImageSrc;
            link.download = 'barcostop-qr.png';
            link.click();
        }
        catch (err) {
            console.error('Error downloading QR:', err);
            alert('Error al descargar el QR');
        }
    };
    const handleShare = async () => {
        if (!canShare) {
            handleCopyLink();
            return;
        }
        try {
            await navigator.share({
                title: 'BarcoStop',
                text: '¡Únete a BarcoStop y comparte viajes en barco!',
                url: url,
            });
        }
        catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
            }
        }
    };
    const handleCopyLink = () => {
        navigator.clipboard.writeText(url);
        alert('✅ Enlace copiado al portapapeles');
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Comparte BarcoStop" }), _jsx("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700 transition", children: _jsx(X, { size: 24 }) })] }), _jsxs(CardContent, { className: "space-y-6 text-center", children: [_jsx("div", { className: "flex justify-center p-4 bg-white rounded-lg border", children: _jsx("img", { src: qrImageSrc, alt: "QR de BarcoStop", className: "w-[200px] h-[200px] object-contain" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Comparte BarcoStop con tus amigos navegantes" }), _jsx("p", { className: "text-xs text-gray-500 break-all leading-relaxed", children: url })] }), _jsxs("div", { className: "space-y-2", children: [canShare && (_jsxs(Button, { onClick: handleShare, className: "w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700", children: [_jsx(Share2, { size: 18 }), "Compartir"] })), _jsxs(Button, { onClick: handleDownload, className: "w-full flex items-center justify-center gap-2", children: [_jsx(Download, { size: 18 }), "Descargar QR"] }), _jsxs(Button, { onClick: handleCopyLink, variant: "outline", className: "w-full flex items-center justify-center gap-2", children: [_jsx(Copy, { size: 18 }), "Copiar enlace"] }), _jsx(Button, { onClick: onClose, variant: "ghost", className: "w-full", children: "Cerrar" })] })] })] }) }));
}
