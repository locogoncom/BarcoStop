<?php

declare(strict_types=1);

require_once __DIR__ . '/includes/layout.php';

siteRenderHeader('BarcoStop | FAQ', 'faq');
?>

<section class="hero">
  <h1>Preguntas frecuentes</h1>
  <p>Respuestas directas sobre como funciona BarcoStop para viajeros y capitanes.</p>
</section>

<section>
  <h2 class="section-title">Cuenta y seguridad</h2>
  <div class="card">
    <ol class="list">
      <li><strong>Como me registro?</strong> Descarga la app, crea cuenta con email y selecciona rol (capitan o viajero).</li>
      <li><strong>Que pasa si olvido mi sesion?</strong> Vuelve a iniciar con tu email y password; el token se renueva automaticamente.</li>
      <li><strong>Mis datos estan protegidos?</strong> Si. La API valida JWT y las contrasenas se almacenan cifradas.</li>
    </ol>
  </div>
</section>

<section>
  <h2 class="section-title">Viajes y reservas</h2>
  <div class="card">
    <ol class="list">
      <li><strong>Como creo un viaje?</strong> Si eres capitan, pulsa "crear viaje", define ruta, fecha, plazas y coste.</li>
      <li><strong>Cuantos asientos puedo reservar?</strong> Segun las plazas disponibles indicadas por el capitan.</li>
      <li><strong>Puedo cancelar una reserva?</strong> Si, desde tus reservas mientras el viaje no haya finalizado.</li>
    </ol>
  </div>
</section>

<section>
  <h2 class="section-title">Comunidad y soporte</h2>
  <div class="card">
    <ol class="list">
      <li><strong>Hay chat entre usuarios?</strong> Si, puedes hablar con otros usuarios y con grupos de regata.</li>
      <li><strong>Como reporto un problema?</strong> Desde la app o en la pagina de contacto.</li>
      <li><strong>Como solicito eliminar mis datos?</strong> Sigue esta guia: <a href="eliminar-cuenta.php">eliminar cuenta y datos</a>.</li>
    </ol>
  </div>
</section>

<?php siteRenderFooter(); ?>
