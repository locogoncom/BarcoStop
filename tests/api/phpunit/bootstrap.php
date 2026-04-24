<?php

declare(strict_types=1);

$srcRoot = dirname(__DIR__, 3) . '/public_html/api/src';
if (!is_dir($srcRoot)) {
    throw new RuntimeException('No se encontro src de API PHP en: ' . $srcRoot);
}

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($srcRoot, FilesystemIterator::SKIP_DOTS)
);

$files = [];
foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $files[] = $file->getPathname();
    }
}

sort($files, SORT_STRING);
foreach ($files as $file) {
    require_once $file;
}
