import { getLocalContext } from "./ragService";
import { chatWithContext } from "./llmService";
import { supabase } from "../config/supabase";

const SUGGESTION_PROMPT =
  "You are a proactive travel planner. Return JSON array of 4-6 suggestion cards with fields: title, category, distance, why_recommended, duration, budget.";

export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not available."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export function detectFreeTime(itinerary = []) {
  if (!Array.isArray(itinerary) || itinerary.length < 2) {
    return 90;
  }

  const sorted = [...itinerary].sort((a, b) => new Date(a.start) - new Date(b.start));
  let maxGap = 0;

  for (let i = 1; i < sorted.length; i += 1) {
    const previousEnd = new Date(sorted[i - 1].end).getTime();
    const currentStart = new Date(sorted[i].start).getTime();
    const diff = Math.floor((currentStart - previousEnd) / 60000);
    if (diff > maxGap) {
      maxGap = diff;
    }
  }

  return Math.max(maxGap, 60);
}

function parseSuggestionJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return [];
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return [];
    }
  }
}

export async function getSuggestions(location, city, freeTimeMinutes, userPrefs = [], tripPurpose = "leisure") {
  const query = `Things to do near ${city} for ${tripPurpose} traveler with ${freeTimeMinutes} mins, prefers ${userPrefs.join(", ")}`;
  const context = await getLocalContext(query, city);
  const response = await chatWithContext(SUGGESTION_PROMPT, context, query);
  const suggestions = parseSuggestionJson(response);

  return suggestions.map((item, idx) => ({
    id: `${city}-${idx + 1}`,
    title: item.title || `Suggestion ${idx + 1}`,
    category: item.category || "activity",
    distance: item.distance || "2.5 km",
    why_recommended: item.why_recommended || "Matches your interests and schedule.",
    duration: item.duration || `${Math.min(120, freeTimeMinutes)} mins`,
    budget: item.budget || "mid",
    location,
  }));
}

export async function pushSuggestionNotification(userId, suggestions = []) {
  if (!userId || !suggestions.length) {
    return;
  }

  const first = suggestions[0];
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title: "New AI Suggestions Ready",
    message: `${suggestions.length} ideas generated. Start with ${first.title}.`,
    type: "suggestion",
  });

  if (error) {
    throw error;
  }
}
