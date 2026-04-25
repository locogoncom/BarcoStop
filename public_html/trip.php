<?php

declare(strict_types=1);

require_once __DIR__.'/includes/layout.php';

$tripId = isset($_GET['id']) ? trim((string) $_GET['id']) : '';
$trip = siteTripById($tripId);

if ($trip === null) {
    http_response_code(404);
    siteRenderHeader('Viaje no encontrado | BarcoStop', '');
    ?>
    <section class="card reveal">
      <h1 class="section-title">Viaje no encontrado</h1>
      <p class="muted">No existe el viaje solicitado o no se pudo cargar.</p>
      <p><a href="index.php">Volver al listado de viajes</a></p>
    </section>
    <?php
    siteRenderFooter();
    exit;
}

$origin = trim((string) ($trip['origin'] ?? ''));
$destination = trim((string) ($trip['destination'] ?? ''));
$route = ($origin !== '' && $destination !== '') ? ($origin . ' -> ' . $destination) : 'Ruta pendiente';
$tripDate = siteFormatTripDate((string) ($trip['departureDate'] ?? ''), (string) ($trip['departureTime'] ?? ''));
$duration = trim((string) ($trip['estimatedDuration'] ?? ''));
$parsedDescription = siteParseTripDescription((string) ($trip['description'] ?? ''));
$description = trim((string) ($parsedDescription['plain'] ?? ''));
$imageUrl = siteTripImageUrl($trip);
$seats = (int) ($trip['availableSeats'] ?? 0);
$cost = number_format((float) ($trip['cost'] ?? 0), 2, ',', '.');
$status = trim((string) ($trip['status'] ?? 'active'));
$captain = is_array($trip['captain'] ?? null) ? $trip['captain'] : [];
$captainName = trim((string) ($captain['name'] ?? 'Capitan'));
$captainBio = trim((string) ($captain['bio'] ?? ''));
$boatName = trim((string) ($captain['boatName'] ?? ''));
$boatType = trim((string) ($captain['boatType'] ?? ''));
$boatModel = trim((string) ($captain['boatModel'] ?? ''));
$homePort = trim((string) ($captain['homePort'] ?? ''));
$instagram = trim((string) ($captain['instagram'] ?? ''));
$appLink = 'https://play.google.com/store/apps/details?id=com.barcostop.app';

siteRenderHeader('Detalle viaje | BarcoStop', '');
?>
<section class="reveal">
  <p class="muted"><a href="index.php">← Volver</a></p>
  <img
    class="trip-detail-image"
    src="<?php echo h($imageUrl); ?>"
    alt="Imagen del viaje"
    loading="lazy"
    onerror="this.onerror=null;this.src='assets/logo-barcostop-header.png';"
  >
  <h1 class="section-title"><?php echo h($route); ?></h1>
  <div class="trip-detail-grid">
    <article class="card">
      <p class="trip-meta"><strong>Salida:</strong> <?php echo h($tripDate); ?></p>
      <p class="trip-meta"><strong>Duracion estimada:</strong> <?php echo h($duration !== '' ? $duration : 'Por definir'); ?></p>
      <p class="trip-meta"><strong>Asientos:</strong> <?php echo h((string) $seats); ?></p>
      <p class="trip-meta"><strong>Coste:</strong> <?php echo h($cost); ?> EUR</p>
      <p class="trip-meta"><strong>Estado:</strong> <?php echo h($status); ?></p>
      <hr>
      <h3>Descripcion</h3>
      <p class="muted"><?php echo h($description !== '' ? $description : 'Sin descripcion adicional.'); ?></p>
    </article>
    <article class="card">
      <h3>Capitan y barco</h3>
      <p class="trip-meta"><strong>Capitan:</strong> <?php echo h($captainName); ?></p>
      <p class="trip-meta"><strong>Barco:</strong> <?php echo h($boatName !== '' ? $boatName : 'Por definir'); ?></p>
      <p class="trip-meta"><strong>Tipo:</strong> <?php echo h($boatType !== '' ? $boatType : 'Por definir'); ?></p>
      <p class="trip-meta"><strong>Modelo:</strong> <?php echo h($boatModel !== '' ? $boatModel : 'Por definir'); ?></p>
      <p class="trip-meta"><strong>Puerto base:</strong> <?php echo h($homePort !== '' ? $homePort : 'Por definir'); ?></p>
      <p class="trip-meta"><strong>Instagram:</strong> <?php echo h($instagram !== '' ? $instagram : 'No indicado'); ?></p>
      <?php if ($captainBio !== '') { ?>
        <hr>
        <p class="muted"><?php echo h($captainBio); ?></p>
      <?php } ?>
      <p style="margin-top:16px">
        <a class="button-like" href="<?php echo h($appLink); ?>" target="_blank" rel="noopener noreferrer">Reservar desde la app</a>
      </p>
    </article>
  </div>
</section>
<?php siteRenderFooter(); ?>
