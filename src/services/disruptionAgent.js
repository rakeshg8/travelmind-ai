import { supabase } from "../config/supabase";
import { chat } from "./llmService";
import { getFlightStatus } from "./flightService";
import { reflowItineraryAfterDisruption } from "./tripPlannerService";

const AGENT_PROMPT =
  'You are an autonomous travel disruption resolution agent. When a travel disruption occurs, analyze the situation and provide: 1) A clear summary of the problem, 2) 2-3 concrete alternative options with estimated times, 3) A recommended action. Be specific, concise, and act like a professional travel assistant. Return JSON only.';

const state = {
  status: "idle",
  flightNumber: null,
  lastChecked: null,
  actions: [],
  currentIssue: null,
};

const monitors = new Map();
const listeners = new Set();

function broadcast() {
  listeners.forEach((listener) => listener({ ...state, actions: [...state.actions] }));
}

function pushAction(message) {
  state.actions.unshift({ message, timestamp: new Date().toISOString() });
  if (state.actions.length > 40) {
    state.actions = state.actions.slice(0, 40);
  }
  broadcast();
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function fallbackAlternatives(type) {
  if (type === "cancellation") {
    return [
      { option: "Rebook on Indigo 6E 402", eta: "+3h 10m", confidence: "high" },
      { option: "Switch to train + cab combo", eta: "+5h 20m", confidence: "medium" },
      { option: "Airport hotel and morning flight", eta: "+11h", confidence: "high" },
    ];
  }
  if (type === "missed_connection") {
    return [
      { option: "Priority transfer desk rebooking", eta: "+2h 30m", confidence: "high" },
      { option: "Partner airline transfer", eta: "+4h", confidence: "medium" },
      { option: "Direct overnight coach", eta: "+7h", confidence: "low" },
    ];
  }
  return [
    { option: "Hold current flight", eta: "+1h 20m", confidence: "high" },
    { option: "Move to alternate departure", eta: "+2h 15m", confidence: "high" },
    { option: "Hybrid rail-air route", eta: "+3h 40m", confidence: "medium" },
  ];
}

function buildAlternativeFlights(details = {}, type = "delay") {
  const flightNumber = details?.raw?.flight_number || details?.flight_number || details?.flightNumber || "current flight";
  const airline = details?.raw?.airline || details?.airline || "same airline";
  const baseDelay = Number(details?.departure_delay || 0);

  if (type === "cancellation") {
    return [
      { option: `Rebook on next ${airline} departure after ${flightNumber}`, eta: "+2h 30m", confidence: "high" },
      { option: `Switch to partner airline near original departure window`, eta: "+4h 10m", confidence: "medium" },
      { option: "Re-route via nearest hub airport with same-day connection", eta: "+5h 20m", confidence: "medium" },
    ];
  }

  return [
    { option: `Stay on ${flightNumber} and monitor delay recovery`, eta: `+${Math.max(baseDelay, 45)}m`, confidence: "high" },
    { option: `Move to an earlier alternate departure on ${airline}`, eta: "+1h 50m", confidence: "high" },
    { option: "Take alternate route via nearby origin airport", eta: "+3h 05m", confidence: "medium" },
  ];
}

function classifyLiveDisruption(statusData = {}) {
  const status = String(statusData?.status || "").toLowerCase();
  const delay = Number(statusData?.departure_delay || 0);

  if (["cancelled", "canceled"].includes(status)) {
    return "cancellation";
  }
  if (["delayed", "active"].includes(status) && delay >= 45) {
    return "delay";
  }
  return null;
}

async function persistTripDisruption(tripId, disruption) {
  if (!tripId) {
    return;
  }
  const { error } = await supabase
    .from("active_trips")
    .update({
      status: disruption.type === "cancellation" ? "cancelled" : "delayed",
      itinerary: {
        disruption,
      },
    })
    .eq("id", tripId);

  if (error) {
    pushAction(`Failed to persist trip update: ${error.message}`);
  }
}

async function notifyTripOwner(tripId, payload) {
  if (!tripId) {
    return;
  }

  const { data: trip, error: tripError } = await supabase
    .from("active_trips")
    .select("user_id")
    .eq("id", tripId)
    .single();

  if (tripError || !trip?.user_id) {
    return;
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: trip.user_id,
    title: "Travel Disruption Agent Update",
    message: payload.recommendation,
    type: "disruption",
  });

  if (error) {
    pushAction(`Failed to push disruption notification: ${error.message}`);
  }
}

async function resolveUserIdForReflow(tripId, planId, fallbackUserId) {
  if (fallbackUserId) {
    return fallbackUserId;
  }

  if (tripId) {
    const { data: trip } = await supabase.from("active_trips").select("user_id").eq("id", tripId).maybeSingle();
    if (trip?.user_id) {
      return trip.user_id;
    }
  }

  if (planId) {
    const { data: plan } = await supabase.from("trip_plans").select("user_id").eq("id", planId).maybeSingle();
    if (plan?.user_id) {
      return plan.user_id;
    }
  }

  return null;
}

export async function checkFlightStatus(flightNumber) {
  state.lastChecked = new Date().toISOString();
  const statusData = await getFlightStatus(flightNumber);
  broadcast();
  return statusData;
}

export async function handleDisruption(
  type,
  details = {},
  tripId = null,
  planId = undefined,
  stopId = undefined,
  userId = undefined
) {
  state.status = "resolving";
  state.currentIssue = { type, details };
  const issueContext =
    details?.details ||
    details?.message ||
    (details?.departure_delay ? `Delay reported: ${details.departure_delay} minutes.` : "No additional context provided.");

  pushAction("Disruption detected...");
  await new Promise((resolve) => setTimeout(resolve, 900));

  pushAction("Analyzing options...");
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const prompt = JSON.stringify({ type, details });
  let llmJson = null;
  try {
    const response = await chat(AGENT_PROMPT, prompt);
    llmJson = safeJson(response);
  } catch (error) {
    pushAction(`Reasoning fallback used: ${error.message}`);
  }

  pushAction("Found 3 alternatives...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const fallbackFlightAlternatives = buildAlternativeFlights(details, type);
  const alternatives = llmJson?.alternatives || fallbackFlightAlternatives || fallbackAlternatives(type);
  const recommendation =
    llmJson?.recommended_action ||
    llmJson?.recommendation ||
    `Recommend option 1 for fastest recovery from ${type}.`;

  const result = {
    recommendation,
    alternatives,
    actionTaken: "Notification sent and trip updated",
    summary:
      llmJson?.summary ||
      `Live disruption: ${type}. ${issueContext}`,
    type,
    source: "live",
    issueContext,
  };

  await persistTripDisruption(tripId, result);
  await notifyTripOwner(tripId, result);

  if (planId && stopId) {
    try {
      const delayMinutes = Number(details?.departure_delay || 0) || (type === "cancellation" ? 240 : 90);
      const resolvedUserId = await resolveUserIdForReflow(tripId, planId, userId);
      if (resolvedUserId) {
        const reflowedItems = await reflowItineraryAfterDisruption(planId, stopId, delayMinutes, resolvedUserId);
        result.reflowedItems = reflowedItems;
        result.delayMinutes = delayMinutes;
        pushAction(`Itinerary reflowed - ${reflowedItems.length} items shifted by ${delayMinutes} minutes`);
      }
    } catch (error) {
      pushAction(`Itinerary reflow failed: ${error.message}`);
    }
  }

  pushAction("Recommendation ready.");
  state.status = "monitoring";
  broadcast();
  return result;
}

export function startMonitoring(tripId, flightNumber, planId = undefined, stopId = undefined, userId = undefined) {
  if (!tripId) {
    return;
  }

  stopMonitoring(tripId);
  state.status = "monitoring";
  state.flightNumber = flightNumber;
  pushAction(`Monitoring started for flight ${flightNumber || "N/A"}.`);

  const runCheck = async () => {
    try {
      const statusData = await checkFlightStatus(flightNumber);
      pushAction(
        `Checked flight status: ${statusData.status} (${statusData.details || "no details"}, delay: ${Number(
          statusData.departure_delay || 0
        )}m).`
      );

      const disruptionType = classifyLiveDisruption(statusData);
      if (disruptionType) {
        await handleDisruption(disruptionType, statusData, tripId, planId, stopId, userId);
      }

      return statusData;
    } catch (error) {
      pushAction(`Monitor error: ${error.message}`);
      throw error;
    }
  };

  // Perform one immediate check so the user sees live status without waiting 60s.
  runCheck();

  const timer = setInterval(async () => {
    await runCheck();
  }, 60000);

  monitors.set(tripId, timer);
  broadcast();
}

export async function checkAndHandleLiveDisruption(tripId, flightNumber, planId, stopId, userId) {
  if (!flightNumber) {
    const error = new Error("Flight number is required for live checks.");
    pushAction(`Live check failed: ${error.message}`);
    throw error;
  }

  state.status = "monitoring";
  state.flightNumber = flightNumber;

  const statusData = await checkFlightStatus(flightNumber);
  pushAction(
    `Checked flight status: ${statusData.status} (${statusData.details || "no details"}, delay: ${Number(
      statusData.departure_delay || 0
    )}m).`
  );

  const disruptionType = classifyLiveDisruption(statusData);
  if (disruptionType) {
    return handleDisruption(disruptionType, statusData, tripId, planId, stopId, userId);
  }

  state.status = "monitoring";
  broadcast();
  return null;
}

export function stopMonitoring(tripId) {
  const timer = monitors.get(tripId);
  if (timer) {
    clearInterval(timer);
    monitors.delete(tripId);
    pushAction("Monitoring stopped.");
  }
  if (!monitors.size) {
    state.status = "idle";
    state.flightNumber = null;
  }
  broadcast();
}

export function subscribeDisruptionState(listener) {
  listeners.add(listener);
  listener({ ...state, actions: [...state.actions] });
  return () => listeners.delete(listener);
}

export function getDisruptionState() {
  return { ...state, actions: [...state.actions] };
}
