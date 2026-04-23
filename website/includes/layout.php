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
    ?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= h($title) ?></title>
  <meta name="description" content="BarcoStop conecta capitanes y viajeros para salir al mar con seguridad.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <header class="topbar">
    <div class="shell topbar-row">
      <a class="brand" href="index.php">BarcoStop</a>
      <nav class="nav">
        <?php foreach ($navigation as $key => $item): ?>
          <a class="nav-link <?= $activePage === $key ? 'is-active' : '' ?>" href="<?= h($item['href']) ?>">
            <?= h($item['label']) ?>
          </a>
        <?php endforeach; ?>
      </nav>
    </div>
  </header>
  <main class="shell page">
<?php
}

function siteRenderFooter(): void
{
    ?>
  </main>
  <footer class="footer">
    <div class="shell footer-row">
      <p>BarcoStop © <?= date('Y') ?></p>
      <a href="https://play.google.com/store/apps/details?id=com.barcostop.app" target="_blank" rel="noopener noreferrer">
        Descargar en Google Play
      </a>
    </div>
  </footer>
</body>
</html>
<?php
}
