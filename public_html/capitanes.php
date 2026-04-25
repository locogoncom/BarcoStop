<?php

declare(strict_types=1);

require_once __DIR__.'/includes/layout.php';

$result = null;
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $result = siteCreateCaptainWithTrip($_POST);
}

siteRenderHeader('Alta Capitanes | BarcoStop', 'capitanes', true);
?>

<section class="mt-6 mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-sm">
  <p class="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">Alta de capitanes</p>
  <h1 class="mt-3 text-3xl font-extrabold text-slate-900">Da de alta tu barco y tu viaje ahora, gratis</h1>
  <p class="mt-2 text-slate-600">Capitán: la tripulación para tu próximo viaje está aquí.</p>
</section>

<section class="mb-8">
  <?php if (is_array($result)) { ?>
    <div class="mb-4 rounded-xl border px-4 py-3 text-sm <?php echo !empty($result['ok']) ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'; ?>">
      <?php echo h((string) ($result['message'] ?? '')); ?>
    </div>
  <?php } ?>

  <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 class="mb-5 text-xl font-bold text-slate-900">Registro de capitanes</h2>

    <form method="post" action="capitanes.php" class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label class="text-sm font-medium text-slate-700">Nombre completo *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="text" name="name" required>

      <label class="text-sm font-medium text-slate-700">Email *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="email" name="email" required>

      <label class="text-sm font-medium text-slate-700">Contraseña *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="password" name="password" required minlength="4">

      <label class="text-sm font-medium text-slate-700">Nombre del barco *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="text" name="boat_name" required>

      <label class="text-sm font-medium text-slate-700">Tipo de barco *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="text" name="boat_type" required>

      <label class="text-sm font-medium text-slate-700">Origen del viaje *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="text" name="origin" required>

      <label class="text-sm font-medium text-slate-700">Destino del viaje *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="text" name="destination" required>

      <label class="text-sm font-medium text-slate-700">Fecha salida *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="date" name="departure_date" required>

      <label class="text-sm font-medium text-slate-700">Hora salida *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="time" name="departure_time" value="10:00" required>

      <label class="text-sm font-medium text-slate-700">Asientos disponibles *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="number" name="available_seats" min="1" value="1" required>

      <label class="text-sm font-medium text-slate-700">Coste por persona EUR *</label>
      <input class="rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" type="number" name="cost" min="0" step="0.5" value="0" required>

      <label class="text-sm font-medium text-slate-700 md:col-span-2">Descripcion</label>
      <textarea class="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 md:col-span-2" name="description" rows="3"></textarea>

      <button class="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 md:col-span-2" type="submit">
        Crear cuenta capitán + viaje
      </button>
    </form>
  </article>
</section>

<?php siteRenderFooter(); ?>
