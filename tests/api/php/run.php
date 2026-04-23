<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$testFiles = [
    __DIR__ . '/AppConfigTest.php',
    __DIR__ . '/HelpersTest.php',
    __DIR__ . '/RouterRequestTest.php',
];

$tests = [];
foreach ($testFiles as $file) {
    $loaded = require $file;
    if (!is_array($loaded)) {
        throw new RuntimeException('Archivo de tests invalido: ' . $file);
    }

    foreach ($loaded as $case) {
        if (!is_array($case) || !isset($case['name'], $case['fn']) || !is_callable($case['fn'])) {
            throw new RuntimeException('Caso invalido en: ' . $file);
        }
        $tests[] = $case;
    }
}

$failures = 0;
$start = microtime(true);
$lines = [];

foreach ($tests as $index => $test) {
    $name = (string) $test['name'];
    try {
        $test['fn']();
        $lines[] = sprintf("[%02d/%02d] PASS %s", $index + 1, count($tests), $name);
    } catch (Throwable $e) {
        $failures++;
        $lines[] = sprintf("[%02d/%02d] FAIL %s", $index + 1, count($tests), $name);
        $lines[] = '  -> ' . $e->getMessage();
    }
}

$durationMs = (int) round((microtime(true) - $start) * 1000);
foreach ($lines as $line) {
    echo $line . PHP_EOL;
}
echo PHP_EOL . sprintf('Total: %d, Failed: %d, Duration: %dms', count($tests), $failures, $durationMs) . PHP_EOL;

exit($failures > 0 ? 1 : 0);
