export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Format duration in minutes to readable string
export const formatDuration = (minutes) => {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Get item type icon label (returns icon-name style key for UI mapping)
export const getItemTypeIcon = (type) => {
  const map = {
    flight: "Plane",
    activity: "Zap",
    food: "UtensilsCrossed",
    sightseeing: "Camera",
    hotel: "Building",
    transport: "Car",
    free_time: "Clock",
    meeting: "Briefcase",
  };
  return map[type] || "MapPin";
};

// Compute current stop index from stops array
export const getCurrentStopIndex = (stops) => {
  const idx = (stops || []).findIndex((stop) => !stop.is_completed);
  return idx === -1 ? Math.max(0, (stops || []).length - 1) : idx;
};

// Add delay minutes to ISO string
export const addMinutesToISO = (isoString, minutes) => {
  if (!isoString) return isoString;
  const d = new Date(isoString);
  d.setMinutes(d.getMinutes() + Number(minutes || 0));
  return d.toISOString();
};
