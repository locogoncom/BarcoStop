import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Download, Copy, X, Share2 } from 'lucide-react';
export function ShareQR({ onClose, appUrl }) {
    const qrRef = useRef(null);
    const url = appUrl || window.location.origin;
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;
    const handleDownload = async () => {
        try {
            const svg = qrRef.current?.querySelector('svg');
            if (!svg)
                return;
            // Convert SVG to PNG using canvas
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return;
            canvas.width = 200;
            canvas.height = 200;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 200);
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                // Download as PNG
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = 'barcostop-qr.png';
                link.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Comparte BarcoStop" }), _jsx("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700 transition", children: _jsx(X, { size: 24 }) })] }), _jsxs(CardContent, { className: "space-y-6 text-center", children: [_jsx("div", { className: "flex justify-center p-4 bg-white rounded-lg border", children: _jsx("div", { ref: qrRef, children: _jsx(QRCodeSVG, { value: url, size: 200, level: "M", includeMargin: true, fgColor: "#000000", bgColor: "#ffffff" }) }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Comparte BarcoStop con tus amigos navegantes" }), _jsx("p", { className: "text-xs text-gray-500 break-all leading-relaxed", children: url })] }), _jsxs("div", { className: "space-y-2", children: [canShare && (_jsxs(Button, { onClick: handleShare, className: "w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700", children: [_jsx(Share2, { size: 18 }), "Compartir"] })), _jsxs(Button, { onClick: handleDownload, className: "w-full flex items-center justify-center gap-2", children: [_jsx(Download, { size: 18 }), "Descargar QR"] }), _jsxs(Button, { onClick: handleCopyLink, variant: "outline", className: "w-full flex items-center justify-center gap-2", children: [_jsx(Copy, { size: 18 }), "Copiar enlace"] }), _jsx(Button, { onClick: onClose, variant: "ghost", className: "w-full", children: "Cerrar" })] })] })] }) }));
}
