<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Support\Helpers;

return [
    [
        'name' => 'Helpers::normalizeRole normaliza patron/viajero',
        'fn' => static function (): void {
            testAssertSame('patron', Helpers::normalizeRole('CAPTAIN'), 'captain debe mapear a patron');
            testAssertSame('viajero', Helpers::normalizeRole('traveler'), 'traveler debe mapear a viajero');
            testAssertSame(null, Helpers::normalizeRole('???', true), 'role desconocido con allowNull=true debe ser null');
        },
    ],
    [
        'name' => 'Helpers::toUploadPath admite rutas y URLs legacy',
        'fn' => static function (): void {
            testAssertSame('/uploads/avatars/a.png', Helpers::toUploadPath('/uploads/avatars/a.png'), 'Ruta absoluta uploads');
            testAssertSame('/uploads/trips/b.webp', Helpers::toUploadPath('uploads/trips/b.webp'), 'Ruta relativa uploads');
            testAssertSame('/uploads/trips/c.jpg', Helpers::toUploadPath('https://api.barcostop.net/api/uploads/trips/c.jpg'), 'URL /api/uploads');
            testAssertSame('/uploads/trips/d.jpg', Helpers::toUploadPath('https://api.barcostop.net/api/v1/uploads/trips/d.jpg'), 'URL /api/v1/uploads');
            testAssertSame(null, Helpers::toUploadPath('https://example.com/photo.png'), 'URL externa no valida');
        },
    ],
    [
        'name' => 'Helpers::nowMillis convierte fecha SQL a epoch ms',
        'fn' => static function (): void {
            $millis = Helpers::nowMillis('2026-01-01 00:00:00');
            $expected = (int) strtotime('2026-01-01 00:00:00') * 1000;
            testAssertSame($expected, $millis, 'Debe convertir correctamente a epoch ms');
        },
    ],
];
