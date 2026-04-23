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
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <header class="topbar">
    <div class="shell topbar-row">
      <a class="brand" href="index.php">
        <img class="brand-logo" src="assets/logo-barcostop.png" alt="Logo BarcoStop">
        <span>BarcoStop</span>
      </a>
      <nav class="nav">
        <?php foreach ($navigation as $key => $item): ?>
          <?php $isActive = $activeValue === $key; ?>
          <a
            class="nav-link <?= $isActive ? 'is-active' : '' ?>"
            href="<?= h($item['href']) ?>"
          >
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
    $documents = array_values(siteMarkdownDocuments());
?>
  </main>
  <footer class="footer">
    <div class="shell footer-doc-links">
      <?php foreach ($documents as $doc): ?>
        <a href="<?= h($doc['url']) ?>"><?= h($doc['label']) ?></a>
      <?php endforeach; ?>
    </div>
    <div class="shell footer-row">
      <p>Copyright Barco Stop AYESA DIGITAL, SLU. B01732791 Paseo de los tilos 25-27, Bajos A. 08034 Barcelona, Spain. Idea Original y v1 por Gonzalo Cordero</p>
      <a href="https://play.google.com/store/apps/details?id=com.barcostop.app" target="_blank" rel="noopener noreferrer">Descargar en Google Play</a>
    </div>
  </footer>
</body>
</html>
<?php
}

function siteRenderMarkdownDocumentPage(string $slug): void
{
    $document = siteMarkdownDocument($slug);

    if ($document === null) {
        http_response_code(404);
        siteRenderHeader('Documento no encontrado | BarcoStop', '');
        ?>
        <section class="doc-section">
          <h1 class="section-title">Documento no encontrado</h1>
          <p class="alert">No existe el documento solicitado.</p>
          <p><a href="index.php">Volver a inicio</a></p>
        </section>
        <?php
        siteRenderFooter();
        return;
    }

    siteRenderHeader($document['title'] . ' | BarcoStop', '');
    $rawMarkdown = @file_get_contents($document['source']);
    ?>
    <section class="doc-section reveal">
      <h1 class="doc-title"><?= h($document['title']) ?></h1>
      <p class="muted doc-source">Origen: <?= h(str_replace(dirname(__DIR__, 2) . '/', '', $document['source'])) ?></p>
      <?php if ($rawMarkdown === false): ?>
        <p class="alert">No se pudo leer el archivo fuente Markdown.</p>
      <?php else: ?>
        <article class="markdown-body">
          <?= siteMarkdownToHtml($rawMarkdown) ?>
        </article>
      <?php endif; ?>
    </section>
    <?php
    siteRenderFooter();
}
