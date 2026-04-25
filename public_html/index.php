<?php

declare(strict_types=1);

require_once __DIR__.'/includes/layout.php';

$metrics = siteHomeMetrics();
$totalUsers = number_format((int) $metrics['totalUsers'], 0, ',', '.');
$totalTrips = number_format((int) $metrics['totalTrips'], 0, ',', '.');
$latestTrips = is_array($metrics['latestTrips']) ? $metrics['latestTrips'] : [];

siteRenderHeader('BarcoStop | Home', 'home');
?>

<section class="hero hero-legacy reveal text-center center">
  
  <div class="hero-app-logo" aria-hidden="true">
    <img src="assets/logo-barcostop-header.png" alt="">
  </div>
  <h1 class="hero-title">Conecta marineros <br> con capitanes</h1>
  <p class="hero-subtitle text-center">
    Encuentra barco o tripulacion en segundos, gratis
  </p>
  <div class="hero-kpis" aria-label="Indicadores principales">
    <span class="kpi-pill"><b><?php echo h($totalUsers); ?></b> usuarios</span>
    <span class="kpi-pill"><b><?php echo h($totalTrips); ?></b> viajes creados</span>
    <span class="kpi-pill"><b><?php echo h((string) count($latestTrips)); ?></b> viajes recientes</span>
  </div>
  <a
    href="https://play.google.com/store/apps/details?id=com.barcostop.app"
    target="_blank"
    rel="noopener noreferrer"
    class="play-cta"
  >
    <img class="play-badge" src="assets/google-play-badge.svg" alt="Descargar en Google Play">
  </a>
  <p class="hero-note text-center">Gratuïto · Sin publicidad · Diseñado para movil · <span class="underline">Gon lo recomienda</span></p>
  <div class="trust-row" aria-label="Confianza">
    <span class="trust-chip">Comunidad verificada</span>
    <span class="trust-chip">Soporte real</span>
    <span class="trust-chip">Datos en vivo</span>
  </div>
</section>

<section class="reveal reveal-d2">
  <h2 class="section-title">Por que BarcoStop</h2>
  <div class="benefits-grid reveal-list">
    <article class="benefit-card">
      <p class="benefit-icon" aria-hidden="true">⚓</p>
      <h3>Publica y llena barco rapido</h3>
      <p class="muted">Capitanes crean salidas en segundos y gestionan plazas sin caos de mensajes.</p>
    </article>
    <article class="benefit-card">
      <p class="benefit-icon" aria-hidden="true">🧭</p>
      <h3>Encuentra viaje con contexto real</h3>
      <p class="muted">Viajeros ven ruta, plazas, coste y estado para reservar con informacion clara.</p>
    </article>
    <article class="benefit-card">
      <p class="benefit-icon" aria-hidden="true">💬</p>
      <h3>Coordina desde un solo sitio</h3>
      <p class="muted">Chat, reservas y seguimiento en una misma app para evitar fricciones.</p>
    </article>
  </div>
</section>

<section class="py-20 text-center reveal reveal-d2 center">
  
    <h3 class="font-extrabold text-4xl">Registro Capitán</h3>
    <p class="muted">La tripulación para tu próximo viaje está aquí.</p>
    <p><a class="button-like" href="capitanes.php">Ir al registro de capitanes</a></p>
  
</section>

<section class="reveal reveal-d3">
  <h2 class="section-title">Barcos, mar y tripulacion</h2>
  <p class="muted">Imagen real para sentir el plan antes de reservar.</p>
  <div class="sea-gallery reveal-list">
    <article class="sea-main">
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
        alt="Velero navegando en mar abierto"
        loading="eager"
      >
      <div class="sea-caption">
        <h3>Tu proxima travesia empieza aqui</h3>
        <p>Conecta capitanes y marineros sin friccion.</p>
      </div>
    </article>
    <article class="sea-card">
      <img
        src="https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80"
        alt="Barco al atardecer"
        loading="lazy"
      >
      <h3>Atardeceres en ruta</h3>
    </article>
    <article class="sea-card">
      <img
        src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80"
        alt="Marineros preparando una salida"
        loading="lazy"
      >
      <h3>Tripulacion lista</h3>
    </article>
    <article class="sea-card">
      <img
        src="https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80"
        alt="Barcos en puerto deportivo"
        loading="lazy"
      >
      <h3>Salida desde puerto</h3>
    </article>
  </div>
</section>

<section class="reveal reveal-d3">
  <h2 class="section-title">Ultimos 6 viajes creados</h2>
  <p class="muted">Ordenados por fecha de creacion descendente.</p>

  <?php if (count($latestTrips) === 0) { ?>
    <article class="card">
      <p class="muted">Todavia no hay viajes para mostrar.</p>
    </article>
  <?php } else { ?>
    <div class="trips-grid reveal-list">
      <?php foreach ($latestTrips as $trip) { ?>
        <?php
        $origin = trim((string) ($trip['origin'] ?? ''));
          $destination = trim((string) ($trip['destination'] ?? ''));
          $route = ($origin !== '' && $destination !== '') ? ($origin.' -> '.$destination) : 'Ruta pendiente';
          $tripDate = siteFormatTripDate((string) ($trip['departureDate'] ?? ''), (string) ($trip['departureTime'] ?? ''));
          $imageUrl = siteTripImageUrl(is_array($trip) ? $trip : []);
          $parsedDescription = siteParseTripDescription((string) ($trip['description'] ?? ''));
          $tripSummary = trim((string) ($parsedDescription['plain'] ?? ''));
          if ($tripSummary === '') $tripSummary = 'Salida publicada en BarcoStop.';
          $captain = (string) ($trip['captainName'] ?? 'Capitan');
          $status = (string) ($trip['status'] ?? 'active');
          $seats = (int) ($trip['availableSeats'] ?? 0);
          $cost = number_format((float) ($trip['cost'] ?? 0), 2, ',', '.');
          ?>
        <article class="trip-card">
          <img
            class="trip-thumb"
            src="<?php echo h($imageUrl); ?>"
            alt="Imagen del viaje"
            loading="lazy"
            onerror="this.onerror=null;this.src='assets/logo-barcostop-header.png';"
          >
          <h3 class="trip-route"><?php echo h($route); ?></h3>
          <p class="trip-meta">Capitan: <?php echo h($captain); ?></p>
          <p class="trip-meta">Salida: <?php echo h($tripDate); ?></p>
          <p class="trip-meta">Asientos: <?php echo h((string) $seats); ?> | Coste: <?php echo h($cost); ?> EUR</p>
          <p class="trip-meta">Estado: <?php echo h($status); ?></p>
          <p class="trip-meta trip-summary"><?php echo h($tripSummary); ?></p>
          <p class="trip-meta"><a href="trip.php?id=<?php echo urlencode((string) ($trip['id'] ?? '')); ?>">Ver detalle</a></p>
        </article>
      <?php } ?>
    </div>
  <?php } ?>
</section>

<section class="reveal">
  <h2 class="section-title">Explora mas</h2>
  <div class="cards-3 reveal-list">
    <article class="card">
      <h3>FAQ</h3>
      <p class="muted">Preguntas comunes sobre reservas, seguridad y soporte.</p>
      <p><a href="faq.php">Ver FAQ</a></p>
    </article>
    <article class="card">
      <h3>Casos de uso</h3>
      <p class="muted">Escenarios reales para capitanes, viajeros y grupos.</p>
      <p><a href="casos-uso.php">Ver casos</a></p>
    </article>
    <article class="card">
      <h3>Contacto</h3>
      <p class="muted">Habla con el equipo de BarcoStop para soporte o alianzas.</p>
      <p><a href="contacto.php">Ir a contacto</a></p>
    </article>
  </div>
</section>

<?php siteRenderFooter(); ?>
