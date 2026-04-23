<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function siteRenderHeader(string $title, string $activePage): void
{
    $navigation = [
        'home' => ['label' => 'Home', 'href' => 'index.php'],
        'faq' => ['label' => 'FAQ', 'href' => 'faq.php'],
        'casos' => ['label' => 'Casos de uso', 'href' => 'casos-uso.php'],
        'contacto' => ['label' => 'Contacto', 'href' => 'contacto.php'],
    ];
    $activeMap = [
        'home' => 'home',
        'faq' => 'faq',
        'casos' => 'casos',
        'contacto' => 'contacto',
    ];
    $activeValue = $activeMap[$activePage] ?? '';
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= h($title) ?></title>
  <meta name="description" content="BarcoStop conecta marineros con capitanes. Encuentra barco o tripulacion en segundos.">
  <meta property="og:title" content="BarcoStop">
  <meta property="og:description" content="Conecta marineros con capitanes">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            circular: [
              '"Plus Jakarta Sans"',
              '"Avenir Next"',
              'Avenir',
              'Inter',
              'ui-sans-serif',
              'system-ui',
              'sans-serif'
            ]
          },
          colors: {
            bstop: {
              950: '#080a0c',
              900: '#0f1216',
              800: '#151a20',
              700: '#202833',
              600: '#2d3a48',
              aqua: '#38bdf8',
              mint: '#6ee7b7'
            }
          },
          boxShadow: {
            glow: '0 18px 60px rgba(56, 189, 248, 0.18)'
          }
        }
      }
    };
  </script>
</head>
<body class="bg-bstop-950 text-white font-circular antialiased">
  <header class="sticky top-0 z-40 border-b border-white/10 bg-bstop-900/80 backdrop-blur-md">
    <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <a class="flex items-center gap-3" href="index.php">
        <img class="h-9 w-9 rounded-xl border border-white/10 bg-white/5 object-cover p-1" src="assets/logo-barcostop.png" alt="Logo BarcoStop">
        <span class="text-lg font-bold tracking-tight">BarcoStop</span>
      </a>
      <nav class="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
        <?php foreach ($navigation as $key => $item): ?>
          <?php $isActive = $activeValue === $key; ?>
          <a
            class="rounded-full px-3 py-1.5 text-sm font-medium transition <?= $isActive ? 'bg-white text-bstop-950' : 'text-white/75 hover:bg-white/10 hover:text-white' ?>"
            href="<?= h($item['href']) ?>"
          >
            <?= h($item['label']) ?>
          </a>
        <?php endforeach; ?>
      </nav>
    </div>
  </header>
  <main class="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
<?php
}

function siteRenderFooter(): void
{
?>
  </main>
  <footer class="border-t border-white/10 bg-bstop-900/70">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>BarcoStop © <?= date('Y') ?> · Hecho para gente que quiere salir al mar</p>
      <a class="text-white/80 hover:text-white" href="https://play.google.com/store/apps/details?id=com.barcostop.app" target="_blank" rel="noopener noreferrer">
        Descargar en Google Play
      </a>
    </div>
  </footer>
</body>
</html>
<?php
}
