-- Demo seed for BarcoStop (Spanish ports)
-- Scope: users + trips + optional reservations
-- Visibility window requested: trips departing up to 2026-04-30

START TRANSACTION;

-- Password for all demo users: demo1234
-- BCrypt hash generated with PHP password_hash(..., PASSWORD_BCRYPT, ['cost' => 10])
SET @demo_hash := '$2y$10$KCQVaT/dUhVw1GFzoVjVH.uevTi8OKX5n3BJ1kZQ7cLs8kJRMfBQO';

-- Captains
INSERT INTO users (
  id, name, email, password, role, bio, current_location, instagram,
  boat_name, boat_type, boat_model, home_port, sailing_experience, certifications, preferred_routes
) VALUES
  ('4e95a07f-4f60-4a3f-9f06-c0f2f5fd4c11', 'Alvaro Ruiz', 'demo.capitan.alvaro@barcostop.net', @demo_hash, 'patron',
   'Capitan costero con enfoque en salidas de dia.', 'Barcelona', '@alvaro_navega',
   'Brisa Norte', 'Velero', 'Beneteau Oceanis 37', 'Barcelona', '8 anos', 'PER', 'Mediterraneo occidental'),
  ('7df6a9d8-2ce4-4b7a-b9a5-33a6c7ce1b22', 'Marta Costa', 'demo.capitan.marta@barcostop.net', @demo_hash, 'patron',
   'Amante de travesias tranquilas y atardeceres.', 'Valencia', '@marta.sail',
   'Llevant', 'Velero', 'Jeanneau Sun Odyssey 36i', 'Valencia', '6 anos', 'PER', 'Valencia-Baleares'),
  ('d2d24f5d-f7f2-47d5-8f47-4f9a9be67333', 'Sergio Marin', 'demo.capitan.sergio@barcostop.net', @demo_hash, 'patron',
   'Salidas de iniciacion y costa andaluza.', 'Malaga', '@sergio.mariner',
   'Azimut Sur', 'Lancha', 'Quicksilver Activ 675', 'Malaga', '10 anos', 'PPER', 'Costa del Sol'),
  ('9b03f6ad-20e8-41f8-8ec7-791cbf2e7444', 'Lucia Vega', 'demo.capitan.lucia@barcostop.net', @demo_hash, 'patron',
   'Navegacion en Canarias para todos los niveles.', 'Las Palmas de Gran Canaria', '@lucia.ocean',
   'Alisios', 'Catamaran', 'Lagoon 380', 'Las Palmas de Gran Canaria', '9 anos', 'PER', 'Canarias')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role),
  bio = VALUES(bio),
  current_location = VALUES(current_location),
  instagram = VALUES(instagram),
  boat_name = VALUES(boat_name),
  boat_type = VALUES(boat_type),
  boat_model = VALUES(boat_model),
  home_port = VALUES(home_port),
  sailing_experience = VALUES(sailing_experience),
  certifications = VALUES(certifications),
  preferred_routes = VALUES(preferred_routes),
  updated_at = CURRENT_TIMESTAMP;

-- Travelers
INSERT INTO users (
  id, name, email, password, role, bio, current_location, instagram, sailing_experience, preferred_routes
) VALUES
  ('2c5bfb0f-1df5-40ff-b9d9-4cb9a2d67a55', 'Clara Nieto', 'demo.viajera.clara@barcostop.net', @demo_hash, 'viajero',
   'Tripulante en crecimiento con ganas de salir cada semana.', 'Alicante', '@clara_waves', 'Intermedio', 'Mediterraneo'),
  ('6f50f8a0-182b-4c72-b17a-2b2e5f8f3b66', 'Javier Soto', 'demo.viajero.javier@barcostop.net', @demo_hash, 'viajero',
   'Disponible para travesias cortas y regatas sociales.', 'Cadiz', '@javi_mar', 'Intermedio', 'Andalucia y Canarias')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role),
  bio = VALUES(bio),
  current_location = VALUES(current_location),
  instagram = VALUES(instagram),
  sailing_experience = VALUES(sailing_experience),
  preferred_routes = VALUES(preferred_routes),
  updated_at = CURRENT_TIMESTAMP;

-- Trips (all by end of April 2026)
INSERT INTO trips (
  id, patron_id, origin, destination, departure_date, departure_time, estimated_duration,
  description, available_seats, cost, status
) VALUES
  ('f3d3a7a4-34cc-4ddb-b8f8-0b808e8be101', '4e95a07f-4f60-4a3f-9f06-c0f2f5fd4c11',
   'Barcelona', 'Sitges', '2026-04-26', '09:00:00', '03:30',
   'Navegacion costera suave para todos los niveles [BSMETA]{"tripKind":"trip","captainNote":"Salida ideal para soltarse","timeWindow":"morning"}',
   4, 35.00, 'active'),
  ('f3d3a7a4-34cc-4ddb-b8f8-0b808e8be102', '7df6a9d8-2ce4-4b7a-b9a5-33a6c7ce1b22',
   'Valencia', 'Denia', '2026-04-27', '10:30:00', '04:00',
   'Ruta con practica basica de maniobras [BSMETA]{"tripKind":"trip","captainNote":"Buen plan de dia completo","timeWindow":"morning"}',
   5, 45.00, 'active'),
  ('f3d3a7a4-34cc-4ddb-b8f8-0b808e8be103', 'd2d24f5d-f7f2-47d5-8f47-4f9a9be67333',
   'Malaga', 'Marbella', '2026-04-28', '11:00:00', '02:45',
   'Costa del Sol, mar tranquilo y vista de sierra [BSMETA]{"tripKind":"trip","captainNote":"Ideal para primera salida","timeWindow":"afternoon"}',
   3, 30.00, 'active'),
  ('f3d3a7a4-34cc-4ddb-b8f8-0b808e8be104', '9b03f6ad-20e8-41f8-8ec7-791cbf2e7444',
   'Las Palmas de Gran Canaria', 'Puerto de Mogan', '2026-04-29', '08:30:00', '05:00',
   'Salida canaria con navegacion de altura moderada [BSMETA]{"tripKind":"trip","captainNote":"Traer gorra y crema solar","timeWindow":"morning"}',
   6, 50.00, 'active'),
  ('f3d3a7a4-34cc-4ddb-b8f8-0b808e8be105', '4e95a07f-4f60-4a3f-9f06-c0f2f5fd4c11',
   'Tarragona', 'Cambrils', '2026-04-30', '16:00:00', '02:30',
   'Paseo de tarde y aprendizaje de roles a bordo [BSMETA]{"tripKind":"trip","captainNote":"Salida de tarde relajada","timeWindow":"afternoon"}',
   4, 25.00, 'active'),
  ('f3d3a7a4-34cc-4ddb-b8f8-0b808e8be106', '7df6a9d8-2ce4-4b7a-b9a5-33a6c7ce1b22',
   'Alicante', 'Santa Pola', '2026-04-30', '09:15:00', '03:00',
   'Travesia corta para practicar trimado [BSMETA]{"tripKind":"trip","captainNote":"Grupo reducido","timeWindow":"morning"}',
   3, 28.00, 'active')
ON DUPLICATE KEY UPDATE
  patron_id = VALUES(patron_id),
  origin = VALUES(origin),
  destination = VALUES(destination),
  departure_date = VALUES(departure_date),
  departure_time = VALUES(departure_time),
  estimated_duration = VALUES(estimated_duration),
  description = VALUES(description),
  available_seats = VALUES(available_seats),
  cost = VALUES(cost),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

-- Optional demo reservations for visual variety
INSERT INTO reservations (id, trip_id, user_id, seats, status, payment_status) VALUES
  ('c31ad224-b927-4f0e-a16f-d50dd8d02101', 'f3d3a7a4-34cc-4ddb-b8f8-0b808e8be101', '2c5bfb0f-1df5-40ff-b9d9-4cb9a2d67a55', 1, 'confirmed', 'pending'),
  ('c31ad224-b927-4f0e-a16f-d50dd8d02102', 'f3d3a7a4-34cc-4ddb-b8f8-0b808e8be102', '6f50f8a0-182b-4c72-b17a-2b2e5f8f3b66', 2, 'pending', 'pending'),
  ('c31ad224-b927-4f0e-a16f-d50dd8d02103', 'f3d3a7a4-34cc-4ddb-b8f8-0b808e8be104', '2c5bfb0f-1df5-40ff-b9d9-4cb9a2d67a55', 1, 'confirmed', 'paid')
ON DUPLICATE KEY UPDATE
  seats = VALUES(seats),
  status = VALUES(status),
  payment_status = VALUES(payment_status),
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
