(async ()=>{
  try {
    const uRes = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Patron', email: 'patron_test@example.com', role: 'patron' })
    });
    const user = await uRes.json();
    console.log('USER:', user);

    const tRes = await fetch('http://localhost:5000/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patronId: user._id,
        route: { origin: 'A', destination: 'B', departureDate: '2026-03-10', departureTime: '09:00' },
        description: 'prueba',
        availableSeats: 2,
        cost: 10
      })
    });
    const trip = await tRes.json();
    console.log('TRIP:', trip);
  } catch (e) {
    console.error(e);
  }
})();
