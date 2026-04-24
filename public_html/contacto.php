<?php

declare(strict_types=1);

require_once __DIR__ . '/includes/layout.php';

$isPost = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$errors = [];
$isValid = false;

if ($isPost) {
    if ($name === '') {
        $errors[] = 'El nombre es obligatorio.';
    }
    if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        $errors[] = 'El email no es valido.';
    }
    if ($message === '' || strlen($message) < 10) {
        $errors[] = 'El mensaje debe tener al menos 10 caracteres.';
    }

    $isValid = count($errors) === 0;
}

siteRenderHeader('BarcoStop | Contacto', 'contacto');
?>

<section class="hero">
  <h1>Contacto</h1>
  <p>Si tienes dudas, propuestas o incidencias, escribe al equipo y te responderemos lo antes posible.</p>
</section>

<section>
  <h2 class="section-title">Canales directos</h2>
  <div class="cards-3">
    <article class="card">
      <h3>Soporte general</h3>
      <p class="muted"><a href="mailto:hola@barcostop.net">hola@barcostop.net</a></p>
    </article>
    <article class="card">
      <h3>Google Play</h3>
      <p class="muted"><a href="https://play.google.com/store/apps/details?id=com.barcostop.app" target="_blank" rel="noopener noreferrer">Ver app en Play Store</a></p>
    </article>
    <article class="card">
      <h3>Consultas tecnicas</h3>
      <p class="muted">Incluye version de app y descripcion del problema para una respuesta mas rapida.</p>
    </article>
  </div>
</section>

<section>
  <h2 class="section-title">Formulario rapido</h2>
  <form class="form" method="post" action="contacto.php" novalidate>
    <?php if ($isPost && $isValid): ?>
      <p class="success">
        Gracias, <?= h($name) ?>. Hemos recibido tu mensaje. Tambien puedes escribirnos a hola@barcostop.net.
      </p>
    <?php endif; ?>

    <?php if (count($errors) > 0): ?>
      <?php foreach ($errors as $error): ?>
        <p class="error"><?= h($error) ?></p>
      <?php endforeach; ?>
    <?php endif; ?>

    <div class="field">
      <label for="name">Nombre</label>
      <input id="name" name="name" type="text" value="<?= h($name) ?>" required>
    </div>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" value="<?= h($email) ?>" required>
    </div>
    <div class="field">
      <label for="message">Mensaje</label>
      <textarea id="message" name="message" required><?= h($message) ?></textarea>
    </div>
    <button class="btn" type="submit">Enviar</button>
  </form>
</section>

<?php siteRenderFooter(); ?>
