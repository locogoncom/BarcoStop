<?php

declare(strict_types=1);

require_once __DIR__ . '/includes/layout.php';

$metrics = siteHomeMetrics();
$totalUsers = number_format((int) $metrics['totalUsers'], 0, ',', '.');
$totalTrips = number_format((int) $metrics['totalTrips'], 0, ',', '.');
$latestTrips = is_array($metrics['latestTrips']) ? $metrics['latestTrips'] : [];

siteRenderHeader('BarcoStop | Home', 'home');
?>

<section class="hero">
  <span class="badge <?= $metrics['dbConnected'] ? 'badge-ok' : 'badge-warn' ?>">
    <?= $metrics['dbConnected'] ? 'Datos en vivo' : 'Datos no disponibles' ?>
  </span>
  <h1>Conecta capitanes y tripulacion en minutos.</h1>
  <p>
    Esta home se alimenta desde MySQL (server_php): mostramos total de usuarios, total de viajes y los ultimos 6 viajes creados.
  </p>
  <div class="stats">
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

<section>
  <h2 class="section-title">Ultimos 6 viajes creados</h2>
  <p class="muted">Ordenados por fecha de creacion descendente.</p>

  <?php if (count($latestTrips) === 0): ?>
    <article class="card">
      <p class="muted">Todavia no hay viajes para mostrar.</p>
    </article>
  <?php else: ?>
    <div class="trips-grid">
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

<section>
  <h2 class="section-title">Explora mas</h2>
  <div class="cards-3">
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
