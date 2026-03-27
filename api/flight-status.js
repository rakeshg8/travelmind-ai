export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { flight_iata } = req.query;
  const normalizedFlightIata = String(flight_iata || '').toUpperCase().replace(/\s+/g, '').trim();

  if (!normalizedFlightIata) {
    return res.status(400).json({
      error: 'flight_iata parameter is required'
    });
  }

  const apiKey = process.env.AVIATIONSTACK_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured on server'
    });
  }

  try {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(normalizedFlightIata)}&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AviationStack responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({
        status: 'scheduled',
        details: 'API error: ' + data.error.message,
        departure_delay: 0,
        eta: null,
        raw: null
      });
    }

    if (!data.data || data.data.length === 0) {
      return res.status(200).json({
        status: 'scheduled',
        details: 'No flight data found for ' + normalizedFlightIata,
        departure_delay: 0,
        eta: null,
        raw: null
      });
    }

    const flight = data.data[0];
    const delay = flight.departure?.delay || 0;

    let status = 'scheduled';
    if (flight.flight_status === 'cancelled') {
      status = 'cancelled';
    } else if (flight.flight_status === 'active' && delay >= 45) {
      status = 'delayed';
    } else if (flight.flight_status === 'active') {
      status = 'active';
    } else if (delay >= 45) {
      status = 'delayed';
    }

    return res.status(200).json({
      status,
      details: flight.flight_status,
      departure_delay: delay,
      eta: flight.arrival?.estimated || null,
      raw: {
        airline: flight.airline?.name,
        flight_number: flight.flight?.iata,
        departure_airport: flight.departure?.airport,
        arrival_airport: flight.arrival?.airport,
        departure_scheduled: flight.departure?.scheduled,
        arrival_scheduled: flight.arrival?.scheduled,
      }
    });

  } catch (error) {
    console.error('Flight proxy error:', error.message);
    return res.status(200).json({
      status: 'scheduled',
      details: 'Flight data temporarily unavailable: ' + error.message,
      departure_delay: 0,
      eta: null,
      raw: null
    });
  }
}
