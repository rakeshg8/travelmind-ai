import axios from "axios";

const FLIGHT_PROXY_BASE_URL = String(import.meta.env.VITE_FLIGHT_PROXY_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const FLIGHT_PROXY_URL = FLIGHT_PROXY_BASE_URL ? `${FLIGHT_PROXY_BASE_URL}/api/flight-status` : "/api/flight-status";

function normalizeFlightIata(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
}

export async function getFlightStatus(flightNumber) {
  try {
    const normalizedFlight = normalizeFlightIata(flightNumber);
    const { data } = await axios.get(FLIGHT_PROXY_URL, {
      params: {
        flight_iata: normalizedFlight,
      },
    });

    // Vercel proxy returns already normalized status payload.
    if (data && typeof data.status === "string" && ("departure_delay" in data || "eta" in data)) {
      return {
        status: data.status || "scheduled",
        details: data.details || "No live status available, using scheduled fallback.",
        departure_delay: data.departure_delay || 0,
        eta: data.eta || null,
        raw: data.raw || null,
      };
    }

    const flight = data?.data?.[0];
    if (!flight) {
      return {
        status: "scheduled",
        details: "No live status available, using scheduled fallback.",
      };
    }

    return {
      status: flight.flight_status || "scheduled",
      details: `${flight.departure?.airport || "Unknown"} to ${flight.arrival?.airport || "Unknown"}`,
      departure_delay: flight.departure?.delay || 0,
      eta: flight.arrival?.estimated,
      raw: flight,
    };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 && !FLIGHT_PROXY_BASE_URL) {
      return {
        status: "scheduled",
        details:
          "Flight API unavailable: /api/flight-status not found in local Vite dev. Run via Vercel dev or set VITE_FLIGHT_PROXY_BASE_URL to your deployed domain.",
      };
    }

    return {
      status: "scheduled",
      details: `Flight API unavailable: ${error.message}`,
    };
  }
}
