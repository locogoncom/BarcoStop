<?php

declare(strict_types=1);

require_once __DIR__ . '/includes/layout.php';

siteRenderHeader('BarcoStop | Casos de uso', 'casos');
?>

<section class="hero">
  <h1>Casos de uso</h1>
  <p>Ejemplos claros de como BarcoStop resuelve situaciones reales en el mar.</p>
</section>

<section>
  <h2 class="section-title">Para capitanes</h2>
  <div class="cards-3">
    <article class="card">
      <h3>Salida de fin de semana</h3>
      <p class="muted">Publicas ruta y plazas. Recibes reservas y validas tripulacion antes de zarpar.</p>
    </article>
    <article class="card">
      <h3>Regata local</h3>
      <p class="muted">Creas un viaje tipo regata y activas chat grupal para coordinar equipo y tiempos.</p>
    </article>
    <article class="card">
      <h3>Gestion recurrente</h3>
      <p class="muted">Reutilizas rutas frecuentes para completar barco rapido y mantener comunidad activa.</p>
    </article>
  </div>
</section>

<section>
  <h2 class="section-title">Para viajeros</h2>
  <div class="cards-3">
    <article class="card">
      <h3>Encuentra ruta cercana</h3>
      <p class="muted">Filtras viajes activos y reservas plaza en minutos, sin llamadas ni cadenas de mensajes.</p>
    </article>
    <article class="card">
      <h3>Comunidad fiable</h3>
      <p class="muted">Revisas perfil del capitan, valoraciones y detalles antes de confirmar tu reserva.</p>
    </article>
    <article class="card">
      <h3>Seguimiento del viaje</h3>
      <p class="muted">Recibes updates del trayecto y sabes en que estado esta la salida reservada.</p>
    </article>
  </div>
</section>

<section>
  <h2 class="section-title">Para clubs y grupos nauticos</h2>
  <div class="card">
    <ul class="list">
      <li>Centralizan salidas de socios con informacion en una sola plataforma.</li>
      <li>Evitan sobre-reserva al controlar plazas y estados en tiempo real.</li>
      <li>Mejoran comunicacion con chat y publicaciones de nuevas travesias.</li>
    </ul>
  </div>
</section>

<?php siteRenderFooter(); ?>
