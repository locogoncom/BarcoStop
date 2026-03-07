import React from 'react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Heart } from 'lucide-react';

interface DonateProps {
  onClose: () => void;
}

export function Donate({ onClose }: DonateProps) {
  const handlePayPalClick = () => {
    // Link directo a tu PayPal.me
    window.open('https://paypal.me/BarcoStop', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-4 text-center">
          <Heart size={48} className="mx-auto text-red-500 fill-red-500" />
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invitación simbólica — Apoya BarcoStop
            </h2>
            <p className="text-gray-600">
              Tu donación nos ayuda a mejorar la plataforma y conectar a más navegantes alrededor del mundo.
            </p>
          </div>

          <div className="space-y-2 py-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium">💡 ¿Cómo usamos tu apoyo?</p>
              <ul className="mt-2 text-left space-y-1">
                <li>✨ Desarrollo de nuevas funciones</li>
                <li>🔒 Seguridad y protección de datos</li>
                <li>📱 Mejor experiencia en la app</li>
                <li>🌍 Expansión a nuevas regiones</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handlePayPalClick}
              className="flex-1 flex items-center justify-center gap-2"
            >
              💙 Invitación simbólica
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Después
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            El sistema de donaciones es completamente opcional.
            <br />
            En el futuro cobraremos una comisión simbólica por reservas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
