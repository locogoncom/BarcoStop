<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Config\AppConfig;

return [
    [
        'name' => 'AppConfig::int parsea enteros y usa fallback',
        'fn' => static function (): void {
            testWithEnv('TEST_INT_VALUE', '42', static function (): void {
                testAssertSame(42, AppConfig::int('TEST_INT_VALUE', 7), 'Debe parsear integer');
            });

            testWithEnv('TEST_INT_VALUE', 'nope', static function (): void {
                testAssertSame(7, AppConfig::int('TEST_INT_VALUE', 7), 'Debe usar fallback con valor no numerico');
            });
        },
    ],
    [
        'name' => 'AppConfig::bool reconoce true values',
        'fn' => static function (): void {
            testWithEnv('TEST_BOOL_VALUE', 'yes', static function (): void {
                testAssertTrue(AppConfig::bool('TEST_BOOL_VALUE', false), 'yes debe ser true');
            });

            testWithEnv('TEST_BOOL_VALUE', '0', static function (): void {
                testAssertSame(false, AppConfig::bool('TEST_BOOL_VALUE', true), '0 debe ser false');
            });
        },
    ],
];
