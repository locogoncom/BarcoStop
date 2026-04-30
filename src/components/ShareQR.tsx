import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Download, Copy, X, Share2 } from 'lucide-react';

interface ShareQRProps {
  onClose: () => void;
  appUrl?: string;
}

export function ShareQR({ onClose, appUrl }: ShareQRProps) {
  const url = appUrl || 'https://barcostop.net/qr';
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const qrImageSrc = '/assets/http_www_barcostop_net_qr.png';

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = qrImageSrc;
      link.download = 'barcostop-qr.png';
      link.click();
    } catch (err) {
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
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    alert('✅ Enlace copiado al portapapeles');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Comparte BarcoStop</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="flex justify-center p-4 bg-white rounded-lg border">
            <img src={qrImageSrc} alt="QR de BarcoStop" className="w-[200px] h-[200px] object-contain" />
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Comparte BarcoStop con tus amigos navegantes
            </p>
            <p className="text-xs text-gray-500 break-all leading-relaxed">
              {url}
            </p>
          </div>

          <div className="space-y-2">
            {canShare && (
              <Button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Share2 size={18} />
                Compartir
              </Button>
            )}

            <Button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Descargar QR
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Copy size={18} />
              Copiar enlace
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
