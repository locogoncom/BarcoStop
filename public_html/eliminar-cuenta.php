<?php

declare(strict_types=1);

require_once __DIR__.'/includes/layout.php';

siteRenderHeader('BarcoStop | Eliminar cuenta y datos', 'faq');
?>

<section class="hero">
  <h1>Eliminar tu cuenta y datos</h1>
  <p>Guia para solicitar la eliminacion de tu cuenta en BarcoStop.</p>
</section>

<section>
  <h2 class="section-title">Paso a paso</h2>
  <article class="card">
    <ol class="list">
      <li>Abre la app BarcoStop en tu dispositivo.</li>
      <li>Accede a tu perfil desde el menu principal.</li>
      <li>Pulsa el boton <strong>Eliminar mi cuenta y datos</strong> al final de la pantalla de perfil.</li>
      <li>Confirma la eliminacion cuando se te solicite.</li>
    </ol>
    <p>Si tienes problemas, escribe a <a href="mailto:soporte@barcostop.com">soporte@barcostop.com</a>.</p>
  </article>
</section>

<section>
  <h2 class="section-title">Que datos se eliminan</h2>
  <article class="card">
    <ul class="list">
      <li>Cuenta de usuario: nombre, correo y contrasena cifrada.</li>
      <li>Reservas, viajes, mensajes, valoraciones y favoritos asociados a tu cuenta.</li>
    </ul>
  </article>
</section>

<section>
  <h2 class="section-title">Conservacion y plazos</h2>
  <article class="card">
    <ul class="list">
      <li>No se conserva ningun dato personal tras la eliminacion de la cuenta.</li>
      <li>Datos anonimos o agregados pueden conservarse para analitica.</li>
      <li>La eliminacion en app es inmediata tras la confirmacion.</li>
      <li>Si llega por soporte, se resuelve en un maximo de 30 dias.</li>
    </ul>
    <p>Para mas informacion, revisa la <a href="privacy-policy-es.php">Politica de Privacidad</a>.</p>
  </article>
</section>

<?php siteRenderFooter(); ?>
