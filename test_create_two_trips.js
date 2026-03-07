(async ()=>{
  try {
    // Try to create or find a test patron user by email
    const email = 'patron_auto@example.com';
    let user;

    // check existing users
    const listRes = await fetch('http://localhost:5000/api/users');
    const users = await listRes.json();
    user = users.find(u => u.email === email);

    if (!user) {
      const uRes = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Auto Patron', email, role: 'patron' })
      });
      user = await uRes.json();
      console.log('Created user:', user);
    } else {
      console.log('Found existing user:', user);
    }

    const tripsToCreate = [
      {
        patronId: user._id || user.id,
        route: { origin: 'Barcelona', destination: 'Mallorca', departureDate: '2026-04-01', departureTime: '08:00' },
        description: 'Salida de día, buena comida y navegación tranquila.',
        availableSeats: 4,
        cost: 45
      },
      {
        patronId: user._id || user.id,
        route: { origin: 'Valencia', destination: 'Ibiza', departureDate: '2026-04-05', departureTime: '07:30' },
        description: 'Fin de semana rápido hacia la isla.',
        availableSeats: 6,
        cost: 55
      }
    ];

    for (const t of tripsToCreate) {
      const r = await fetch('http://localhost:5000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t)
      });
      const trip = await r.json();
      console.log('Created trip:', trip);
    }

    console.log('Done.');
  } catch (e) {
    console.error('Error creating trips:', e);
  }
})();
