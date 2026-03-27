import { supabase } from "../config/supabase";
import { chat } from "./llmService";
import { addMinutesToISO } from "../utils/helpers";

function parseJsonPayload(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function buildLocalFallbackItems(stops = [], totalBudget = 0) {
  const safeStops = Array.isArray(stops) ? stops : [];
  const perStopBudget = safeStops.length ? Math.max(1000, Number(totalBudget || 0) / safeStops.length) : 2000;

  return safeStops.flatMap((stop) => {
    const day = stop.arrival_date || new Date().toISOString().slice(0, 10);
    return [
      {
        stop_city: stop.city,
        item_type: "transport",
        title: `Arrive and local transfer in ${stop.city}`,
        description: "Airport/railway pickup and check-in transit.",
        location: stop.destination_detail || stop.city,
        scheduled_start: `${day}T08:30:00.000Z`,
        scheduled_end: `${day}T09:30:00.000Z`,
        duration_minutes: 60,
        budget_estimate: Math.round(perStopBudget * 0.08),
      },
      {
        stop_city: stop.city,
        item_type: "sightseeing",
        title: `${stop.city} core sightseeing block`,
        description: "Top landmarks and neighborhood walk.",
        location: stop.city,
        scheduled_start: `${day}T10:30:00.000Z`,
        scheduled_end: `${day}T13:00:00.000Z`,
        duration_minutes: 150,
        budget_estimate: Math.round(perStopBudget * 0.2),
      },
      {
        stop_city: stop.city,
        item_type: "food",
        title: `${stop.city} local food experience`,
        description: "Regional lunch and evening snack recommendations.",
        location: stop.city,
        scheduled_start: `${day}T13:15:00.000Z`,
        scheduled_end: `${day}T14:15:00.000Z`,
        duration_minutes: 60,
        budget_estimate: Math.round(perStopBudget * 0.18),
      },
      {
        stop_city: stop.city,
        item_type: "free_time",
        title: "Buffer / free time",
        description: "Flexible slot for delays or rest.",
        location: stop.city,
        scheduled_start: `${day}T16:00:00.000Z`,
        scheduled_end: `${day}T17:00:00.000Z`,
        duration_minutes: 60,
        budget_estimate: 0,
      },
    ];
  });
}

function mapItemToStopId(item, stops) {
  const city = String(item?.stop_city || "").toLowerCase().trim();
  if (!city) {
    return stops[0]?.id || null;
  }

  const exact = stops.find((stop) => String(stop.city || "").toLowerCase().trim() === city);
  if (exact) {
    return exact.id;
  }

  const partial = stops.find((stop) => city.includes(String(stop.city || "").toLowerCase().trim()));
  return partial?.id || stops[0]?.id || null;
}

function normalizeItemType(rawType) {
  const normalized = String(rawType || "activity")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  const aliases = {
    restaurant: "food",
    meals: "food",
    meal: "food",
    dining: "food",
    sight: "sightseeing",
    sightseeing_spot: "sightseeing",
    monument: "sightseeing",
    attraction: "sightseeing",
    travel: "transport",
    transit: "transport",
    commute: "transport",
    cab: "transport",
    train: "transport",
    bus: "transport",
    check_in: "hotel",
    checkout: "hotel",
    accommodation: "hotel",
    lodging: "hotel",
    free: "free_time",
    break: "free_time",
    downtime: "free_time",
    work: "meeting",
    business: "meeting",
  };

  const value = aliases[normalized] || normalized;
  const allowed = new Set([
    "flight",
    "activity",
    "food",
    "sightseeing",
    "hotel",
    "transport",
    "free_time",
    "meeting",
  ]);

  return allowed.has(value) ? value : "activity";
}

export async function createTripPlan(userId, planName = "My Trip", totalBudget = null) {
  try {
    const { data, error } = await supabase
      .from("trip_plans")
      .insert({
        user_id: userId,
        plan_name: planName || "My Trip",
        total_budget: totalBudget ? Number(totalBudget) : null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("createTripPlan failed:", error);
    throw new Error(`Create trip plan failed: ${error.message}`);
  }
}

export async function addTripStop(planId, userId, stopData) {
  try {
    const { data: maxRows, error: maxError } = await supabase
      .from("trip_stops")
      .select("stop_order")
      .eq("plan_id", planId)
      .order("stop_order", { ascending: false })
      .limit(1);

    if (maxError) {
      throw maxError;
    }

    const nextOrder = (maxRows?.[0]?.stop_order || 0) + 1;

    const { data, error } = await supabase
      .from("trip_stops")
      .insert({
        plan_id: planId,
        user_id: userId,
        stop_order: nextOrder,
        city: stopData.city,
        destination_detail: stopData.destination_detail || null,
        arrival_date: stopData.arrival_date || null,
        departure_date: stopData.departure_date || null,
        flight_number: stopData.flight_number || null,
        purpose: stopData.purpose || null,
        budget_for_stop: stopData.budget_for_stop ? Number(stopData.budget_for_stop) : null,
        preferences: stopData.preferences || [],
        notes: stopData.notes || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("addTripStop failed:", error);
    throw new Error(`Add trip stop failed: ${error.message}`);
  }
}

export async function getTripPlan(planId) {
  try {
    const [{ data: plan, error: planError }, { data: stops, error: stopsError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabase.from("trip_plans").select("*").eq("id", planId).single(),
        supabase.from("trip_stops").select("*").eq("plan_id", planId).order("stop_order", { ascending: true }),
        supabase
          .from("trip_itinerary_items")
          .select("*")
          .eq("plan_id", planId)
          .order("item_order", { ascending: true }),
      ]);

    if (planError) throw planError;
    if (stopsError) throw stopsError;
    if (itemsError) throw itemsError;

    return { plan, stops: stops || [], items: items || [] };
  } catch (error) {
    console.error("getTripPlan failed:", error);
    throw new Error(`Get trip plan failed: ${error.message}`);
  }
}

export async function getUserActivePlan(userId) {
  try {
    const { data: plan, error: planError } = await supabase
      .from("trip_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError) {
      throw planError;
    }

    if (!plan) {
      return null;
    }

    const { stops, items } = await getTripPlan(plan.id);
    return { plan, stops, items };
  } catch (error) {
    console.error("getUserActivePlan failed:", error);
    throw new Error(`Get user active plan failed: ${error.message}`);
  }
}

export async function generateItinerary(planId, userId, stops, totalBudget) {
  try {
    const systemPrompt =
      "You are an expert Indian travel planner. Generate a detailed day-by-day itinerary for a multi-stop trip. Return ONLY valid JSON in this exact format: { items: [ { stop_city, item_type, title, description, location, scheduled_start (ISO string), scheduled_end (ISO string), duration_minutes, budget_estimate, notes } ] }. Be specific with Indian city landmarks, restaurants, and transport. Use realistic timings. Total budget is " +
      `${totalBudget || 0} INR.`;

    const userMessage = JSON.stringify(stops || []);
    let rawItems = [];
    try {
      const response = await chat(systemPrompt, userMessage);
      const parsed = parseJsonPayload(response);
      rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
    } catch (llmError) {
      console.error("generateItinerary llm call failed, using local fallback:", llmError);
    }

    if (!rawItems.length) {
      rawItems = buildLocalFallbackItems(stops, totalBudget);
    }

    const { error: deleteError } = await supabase
      .from("trip_itinerary_items")
      .delete()
      .eq("plan_id", planId)
      .eq("is_ai_generated", true);

    if (deleteError) {
      throw deleteError;
    }

    const inserts = rawItems
      .map((item, idx) => {
        const stopId = mapItemToStopId(item, stops);
        if (!stopId || !item?.title) {
          return null;
        }
        return {
          plan_id: planId,
          stop_id: stopId,
          user_id: userId,
          item_order: idx + 1,
          item_type: normalizeItemType(item.item_type),
          title: item.title,
          description: item.description || null,
          location: item.location || null,
          scheduled_start: item.scheduled_start || null,
          scheduled_end: item.scheduled_end || null,
          duration_minutes: item.duration_minutes ? Number(item.duration_minutes) : null,
          budget_estimate: item.budget_estimate ? Number(item.budget_estimate) : null,
          is_ai_generated: true,
          is_completed: false,
        };
      })
      .filter(Boolean);

    if (!inserts.length) {
      return [];
    }

    const { data: inserted, error: insertError } = await supabase
      .from("trip_itinerary_items")
      .insert(inserts)
      .select()
      .order("item_order", { ascending: true });

    if (insertError) {
      throw insertError;
    }

    return inserted || [];
  } catch (error) {
    console.error("generateItinerary failed:", error);
    throw new Error(`Generate itinerary failed: ${error.message}`);
  }
}

export async function reflowItineraryAfterDisruption(planId, stopId, delayMinutes, userId) {
  try {
    const { data: items, error: itemsError } = await supabase
      .from("trip_itinerary_items")
      .select("*")
      .eq("plan_id", planId)
      .eq("user_id", userId)
      .order("item_order", { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    const rows = items || [];
    const startIdx = rows.findIndex((item) => item.stop_id === stopId);
    if (startIdx === -1) {
      return [];
    }

    const affected = rows.slice(startIdx).map((item) => ({
      ...item,
      scheduled_start: addMinutesToISO(item.scheduled_start, delayMinutes),
      scheduled_end: addMinutesToISO(item.scheduled_end, delayMinutes),
    }));

    const updates = await Promise.all(
      affected.map((item) =>
        supabase
          .from("trip_itinerary_items")
          .update({
            scheduled_start: item.scheduled_start,
            scheduled_end: item.scheduled_end,
          })
          .eq("id", item.id)
          .eq("user_id", userId)
      )
    );

    updates.forEach(({ error }) => {
      if (error) {
        throw error;
      }
    });

    const { error: stopError } = await supabase
      .from("trip_stops")
      .update({
        flight_status: "delayed",
        flight_delay_minutes: delayMinutes,
      })
      .eq("id", stopId)
      .eq("user_id", userId);

    if (stopError) {
      throw stopError;
    }

    return affected;
  } catch (error) {
    console.error("reflowItineraryAfterDisruption failed:", error);
    throw new Error(`Reflow itinerary failed: ${error.message}`);
  }
}

export async function markStopCompleted(stopId, userId) {
  try {
    const { data, error } = await supabase
      .from("trip_stops")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", stopId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("markStopCompleted failed:", error);
    throw new Error(`Mark stop completed failed: ${error.message}`);
  }
}

export async function markItineraryItemCompleted(itemId, userId) {
  try {
    const { data, error } = await supabase
      .from("trip_itinerary_items")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("markItineraryItemCompleted failed:", error);
    throw new Error(`Mark itinerary item completed failed: ${error.message}`);
  }
}

export async function getNextPendingStop(planId) {
  try {
    const { data, error } = await supabase
      .from("trip_stops")
      .select("*")
      .eq("plan_id", planId)
      .eq("is_completed", false)
      .order("stop_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data || null;
  } catch (error) {
    console.error("getNextPendingStop failed:", error);
    throw new Error(`Get next pending stop failed: ${error.message}`);
  }
}

export async function generateBudgetItinerary(
  userId,
  city,
  totalBudget,
  days,
  purpose,
  preferences = []
) {
  try {
    const systemPrompt =
      "You are an expert Indian travel budget planner. Given a city, budget in INR, number of days, and traveler purpose, generate a practical day-by-day budget itinerary. Include: best budget accommodation options, must-visit free/cheap sights, budget meal recommendations with approximate costs, local transport tips, and total estimated spend. Format as a clear readable itinerary with Day 1, Day 2 etc. Be specific to Indian cities, use real place names and realistic rupee costs.";

    const userMessage = `City: ${city}. Budget: ₹${totalBudget}. Days: ${days}. Purpose: ${purpose}. Preferences: ${preferences.join(
      ", "
    )}. Generate a complete budget travel itinerary.`;

    const response = await chat(systemPrompt, userMessage);
    return response;
  } catch (error) {
    console.error("generateBudgetItinerary failed:", error);
    throw new Error(`Generate budget itinerary failed: ${error.message}`);
  }
}
