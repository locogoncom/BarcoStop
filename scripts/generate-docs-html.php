<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$publicRoot = $root . '/public_html';
$docsDir = $publicRoot . '/docs';

require_once $publicRoot . '/includes/bootstrap.php';

/**
 * @return non-empty-string
 */
function esc(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

$documents = array_values(siteMarkdownDocuments());

if (!is_dir($docsDir) && !mkdir($docsDir, 0775, true) && !is_dir($docsDir)) {
    fwrite(STDERR, "No se pudo crear el directorio de docs: {$docsDir}\n");
    exit(1);
}

$navigation = [
    ['label' => 'Home', 'href' => '../index.php'],
    ['label' => 'FAQ', 'href' => '../faq.php'],
    ['label' => 'Casos de uso', 'href' => '../casos-uso.php'],
    ['label' => 'Contacto', 'href' => '../contacto.php'],
];

$generated = 0;

foreach ($documents as $doc) {
    $slug = (string) ($doc['slug'] ?? '');
    $title = esc($doc['title'] ?? 'Documento');
    $source = (string) ($doc['source'] ?? '');
    $targetUrl = basename((string) ($doc['url'] ?? ($slug . '.html')));

    if ($slug === '' || $source === '' || $targetUrl === '') {
        fwrite(STDERR, "Documento con datos incompletos, se omite.\n");
        continue;
    }

    $markdown = @file_get_contents($source);
    if (!is_string($markdown)) {
        fwrite(STDERR, "No se pudo leer: {$source}\n");
        continue;
    }

    $markdownHtml = siteMarkdownToHtml($markdown);

    $footerLinks = '';
    foreach ($documents as $linkDoc) {
        $href = basename((string) ($linkDoc['url'] ?? ''));
        $label = esc($linkDoc['label'] ?? 'Documento');
        $isCurrent = ((string) ($linkDoc['slug'] ?? '')) === $slug;
        $currentClass = $isCurrent ? ' class="is-active"' : '';
        $footerLinks .= "      <a{$currentClass} href=\"{$href}\">{$label}</a>\n";
    }

    $targetPath = $docsDir . '/' . $targetUrl;
    $page = <<<HTML
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title} | BarcoStop</title>
  <meta name="description" content="Documentacion de BarcoStop.">
  <meta property="og:title" content="BarcoStop">
  <meta property="og:description" content="Conecta marineros con capitanes">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/site.css">
</head>
<body>
  <header class="topbar">
    <div class="shell topbar-row">
      <a class="brand" href="../index.php">
        <img class="brand-logo" src="../assets/logo-barcostop.png" alt="Logo BarcoStop">
        <span>BarcoStop</span>
      </a>
      <nav class="nav">
HTML;
    $page .= "\n";

    foreach ($navigation as $item) {
        $label = esc($item['label']);
        $href = esc($item['href']);
        $page .= "        <a class=\"nav-link\" href=\"{$href}\">{$label}</a>\n";
    }

    $page .= <<<HTML
      </nav>
    </div>
  </header>
  <main class="shell page">
    <section class="doc-section reveal">
      <h1 class="doc-title">{$title}</h1>
      <p class="muted doc-source">Documento exportado a HTML estatico para despliegue web.</p>
      <article class="markdown-body">
{$markdownHtml}
      </article>
    </section>
  </main>
  <footer class="footer">
    <div class="shell footer-doc-links">
{$footerLinks}    </div>
    <div class="shell footer-row">
      <p>Copyright Barco Stop AYESA DIGITAL, SLU. B01732791 Paseo de los tilos 25-27, Bajos A. 08034 Barcelona, Spain. Idea Original y v1 por Gonzalo Cordero</p>
      <a href="https://play.google.com/store/apps/details?id=com.barcostop.app" target="_blank" rel="noopener noreferrer">Descargar en Google Play</a>
    </div>
  </footer>
</body>
</html>
HTML;

    if (file_put_contents($targetPath, $page) === false) {
        fwrite(STDERR, "No se pudo escribir: {$targetPath}\n");
        continue;
    }

    $generated++;
}

echo "Documentos HTML generados: {$generated}\n";
