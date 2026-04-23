<?php

declare(strict_types=1);

require_once __DIR__ . '/includes/layout.php';

$metrics = siteHomeMetrics();
$totalUsers = number_format((int) $metrics['totalUsers'], 0, ',', '.');
$totalTrips = number_format((int) $metrics['totalTrips'], 0, ',', '.');
$latestTrips = is_array($metrics['latestTrips']) ? $metrics['latestTrips'] : [];

siteRenderHeader('BarcoStop | Home', 'home');
?>

<section class="hero hero-legacy reveal">
  <p class="hero-kicker">Version 53 · API PHP activa</p>
  <h1 class="hero-title">Conecta marineros <br> con capitanes</h1>
  <p class="hero-subtitle">
    Encuentra barco o tripulacion en segundos.
    La forma mas facil de salir al mar.
  </p>
  <div class="hero-kpis" aria-label="Indicadores principales">
    <span class="kpi-pill"><b><?= h($totalUsers) ?></b> usuarios</span>
    <span class="kpi-pill"><b><?= h($totalTrips) ?></b> viajes creados</span>
    <span class="kpi-pill"><b><?= h((string) count($latestTrips)) ?></b> viajes recientes</span>
  </div>
  <a
    href="https://play.google.com/store/apps/details?id=com.barcostop.app"
    target="_blank"
    rel="noopener noreferrer"
    class="play-cta"
  >
    <span class="play-logo" aria-hidden="true">
      <svg viewBox="0 0 512 512" role="img">
        <path fill="#00d95f" d="M20 20l260 236L20 492z" />
        <path fill="#00a4ff" d="M20 20l188 168 62 68L20 492z" opacity=".8" />
        <path fill="#ffd400" d="M280 256l72 65 120-65-120-65z" />
        <path fill="#ff4b4b" d="M20 492l188-168 62-68L20 20z" opacity=".7" />
      </svg>
    </span>
    <span class="play-text">
      <span class="play-text-mini">Descargar en</span>
      <span class="play-text-main">Google Play</span>
    </span>
  </a>
  <p class="hero-note">Gratis · Rapido · Sin complicaciones</p>
  <div class="trust-row" aria-label="Confianza">
    <span class="trust-chip">Comunidad verificada</span>
    <span class="trust-chip">Soporte real</span>
    <span class="trust-chip">Datos en vivo</span>
  </div>
</section>

<section class="hero-metrics reveal reveal-d1">
  <p class="muted">Indicadores en vivo de actividad de BarcoStop.</p>
  <p class="metrics-badge-wrap">
    <span class="badge <?= $metrics['dbConnected'] ? 'badge-ok' : 'badge-warn' ?>">
      <?= $metrics['dbConnected'] ? 'Datos en vivo' : 'Datos no disponibles' ?>
    </span>
  </p>
  <div class="stats reveal-list">
    <article class="stat-card">
      <p class="stat-label">Usuarios registrados</p>
      <p class="stat-value"><?= h($totalUsers) ?></p>
    </article>
    <article class="stat-card">
      <p class="stat-label">Viajes creados</p>
      <p class="stat-value"><?= h($totalTrips) ?></p>
    </article>
    <article class="stat-card">
      <p class="stat-label">Ultimos viajes listados</p>
      <p class="stat-value"><?= h((string) count($latestTrips)) ?></p>
    </article>
  </div>

  <?php if (!$metrics['dbConnected'] && is_string($metrics['dbError']) && $metrics['dbError'] !== ''): ?>
    <p class="alert"><?= h($metrics['dbError']) ?></p>
  <?php endif; ?>
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

<section class="reveal reveal-d3">
  <h2 class="section-title">Barcos, mar y tripulacion</h2>
  <p class="muted">Imagen real para sentir el plan antes de reservar.</p>
  <div class="sea-gallery reveal-list">
    <article class="sea-main">
      <img
        src="https://source.unsplash.com/1600x1000/?sailboat,sea"
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
        src="https://source.unsplash.com/1200x900/?boat,sunset"
        alt="Barco al atardecer"
        loading="lazy"
      >
      <h3>Atardeceres en ruta</h3>
    </article>
    <article class="sea-card">
      <img
        src="https://source.unsplash.com/1200x900/?sailor,crew"
        alt="Marineros preparando una salida"
        loading="lazy"
      >
      <h3>Tripulacion lista</h3>
    </article>
    <article class="sea-card">
      <img
        src="https://source.unsplash.com/1200x900/?yacht,harbor"
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

  <?php if (count($latestTrips) === 0): ?>
    <article class="card">
      <p class="muted">Todavia no hay viajes para mostrar.</p>
    </article>
  <?php else: ?>
    <div class="trips-grid reveal-list">
      <?php foreach ($latestTrips as $trip): ?>
        <?php
        $origin = trim((string) ($trip['origin'] ?? ''));
        $destination = trim((string) ($trip['destination'] ?? ''));
        $route = ($origin !== '' && $destination !== '') ? ($origin . ' -> ' . $destination) : 'Ruta pendiente';
        $tripDate = siteFormatTripDate((string) ($trip['departureDate'] ?? ''), (string) ($trip['departureTime'] ?? ''));
        $captain = (string) ($trip['captainName'] ?? 'Capitan');
        $status = (string) ($trip['status'] ?? 'active');
        $seats = (int) ($trip['availableSeats'] ?? 0);
        $cost = number_format((float) ($trip['cost'] ?? 0), 2, ',', '.');
        ?>
        <article class="trip-card">
          <h3 class="trip-route"><?= h($route) ?></h3>
          <p class="trip-meta">Capitan: <?= h($captain) ?></p>
          <p class="trip-meta">Salida: <?= h($tripDate) ?></p>
          <p class="trip-meta">Asientos: <?= h((string) $seats) ?> | Coste: <?= h($cost) ?> EUR</p>
          <p class="trip-meta">Estado: <?= h($status) ?></p>
        </article>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
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
