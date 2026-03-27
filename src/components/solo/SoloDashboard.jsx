import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  MapPin,
  Plane,
  Plus,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useDisruptionAgent } from "../../hooks/useDisruptionAgent";
import { supabase } from "../../config/supabase";
import { createSoloPost, findMatches } from "../../services/matchingService";
import { getSuggestions, pushSuggestionNotification, detectFreeTime } from "../../services/tripAssistant";
import {
  addTripStop,
  createTripPlan,
  generateItinerary,
  getTripPlan,
  markItineraryItemCompleted,
  markStopCompleted,
} from "../../services/tripPlannerService";
import DisruptionMonitor from "./DisruptionMonitor";
import ProactiveSuggestions from "./ProactiveSuggestions";
import GroupMatchList from "./GroupMatchList";
import AIAssistantPanel from "../common/AIAssistantPanel";
import { notificationService } from "../../services/notificationService";
import { useLocation } from "../../hooks/useLocation";
import { formatDate, formatDuration, getCurrentStopIndex } from "../../utils/helpers";

const PURPOSES = ["leisure", "business", "adventure", "cultural", "transit"];

const ITEM_ICON_MAP = {
  flight: Plane,
  activity: Zap,
  food: UtensilsCrossed,
  sightseeing: Camera,
  hotel: Building,
  transport: Car,
  free_time: Clock,
  meeting: Briefcase,
};

function getStatusClass(status) {
  if (status === "delayed") return "bg-amber-500/20 text-amber-300";
  if (status === "cancelled") return "bg-red-500/20 text-red-300";
  if (status === "completed") return "bg-emerald-500/20 text-emerald-300";
  return "bg-emerald-500/20 text-emerald-300";
}

export default function SoloDashboard() {
  const { user } = useAuth();
  const { location } = useLocation();

  const [dashboardView, setDashboardView] = useState("list");
  // 'list' = trip plans list view
  // 'detail' = full plan detail view
  const [allPlans, setAllPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [activePlan, setActivePlan] = useState(null);
  const [stops, setStops] = useState([]);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [planName, setPlanName] = useState("My Trip");
  const [totalBudget, setTotalBudget] = useState("");
  const [showAddStop, setShowAddStop] = useState(true);

  const [addStopLoading, setAddStopLoading] = useState(false);
  const [reflowLoading, setReflowLoading] = useState(false);
  const [updatedItemIds, setUpdatedItemIds] = useState([]);
  const [updateBanner, setUpdateBanner] = useState("");
  const [expandedStopId, setExpandedStopId] = useState(null);

  const [stopForm, setStopForm] = useState({
    city: "Bengaluru",
    destination_detail: "",
    arrival_date: "",
    departure_date: "",
    flight_number: "",
    purpose: "leisure",
    budget_for_stop: "",
    preferences: "Food,Culture",
    notes: "",
  });

  // Legacy state kept for existing solo features and disruption monitor wiring.
  const [trip, setTrip] = useState(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [disruptionResult, setDisruptionResult] = useState(null);

  const { agentState, start, checkNow } = useDisruptionAgent(trip?.id, trip?.flight_number);

  const currentStop = stops[currentStopIndex] || null;
  const currentCity = useMemo(
    () => currentStop?.city || activePlan?.plan_name || "Bengaluru",
    [currentStop?.city, activePlan?.plan_name]
  );

  const loadAllPlans = async () => {
    if (!user) return;
    setLoadingPlans(true);
    try {
      const { data, error } = await supabase
        .from("trip_plans")
        .select(
          `
        *,
        trip_stops (
          id, city, arrival_date, departure_date,
          is_completed, stop_order, flight_status
        )
      `
        )
        .eq("user_id", user.uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAllPlans(data || []);
    } catch (err) {
      console.error("Failed to load trip plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const openPlan = async (planId) => {
    try {
      const { plan, stops: fetchedStops, items } = await getTripPlan(planId);
      setActivePlan(plan);
      setStops(fetchedStops || []);
      setItineraryItems(items || []);
      setCurrentStopIndex(getCurrentStopIndex(fetchedStops || []));
      setPlanName(plan.plan_name);
      setTotalBudget(plan.total_budget?.toString() || "");
      setExpandedStopId(fetchedStops?.[0]?.id || null);
      setShowAddStop(false);
      setDashboardView("detail");
    } catch (err) {
      console.error("Failed to open plan:", err);
    }
  };

  const handleCreateNewPlan = () => {
    setActivePlan(null);
    setStops([]);
    setItineraryItems([]);
    setCurrentStopIndex(0);
    setPlanName("My Trip");
    setTotalBudget("");
    setShowAddStop(true);
    setExpandedStopId(null);
    setDashboardView("detail");
  };

  const handleBackToList = async () => {
    setDashboardView("list");
    setActivePlan(null);
    setStops([]);
    setItineraryItems([]);
    setShowAddStop(false);
    await loadAllPlans();
  };

  const getPlanSummary = (plan) => {
    const planStops = [...(plan.trip_stops || [])];
    const completed = planStops.filter((s) => s.is_completed).length;
    const ordered = planStops.sort((a, b) => a.stop_order - b.stop_order);
    const cities = ordered.map((s) => s.city).join(" -> ");
    const firstDate = ordered[0]?.arrival_date;
    const lastDate = ordered[ordered.length - 1]?.departure_date;
    const hasDelay = ordered.some((s) => s.flight_status === "delayed" || s.flight_status === "cancelled");
    return { stops: ordered, completed, cities, firstDate, lastDate, hasDelay };
  };

  const refreshCurrentStopIndex = (nextStops) => {
    const idx = getCurrentStopIndex(nextStops);
    setCurrentStopIndex(Math.max(0, idx));
  };

  useEffect(() => {
    if (!user) return;
    loadAllPlans();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const latestMessage = agentState?.actions?.[0]?.message || "";
    if (!activePlan?.id || !latestMessage.startsWith("Itinerary reflowed")) {
      return;
    }

    const reload = async () => {
      try {
        const snapshot = await getTripPlan(activePlan.id);
        setItineraryItems(snapshot.items);
      } catch (error) {
        console.error("Failed to refresh itinerary after reflow:", error);
      }
    };

    reload();
  }, [agentState?.actions, activePlan?.id]);

  useEffect(() => {
    if (!updatedItemIds.length) return;
    const timer = setTimeout(() => setUpdatedItemIds([]), 3000);
    return () => clearTimeout(timer);
  }, [updatedItemIds]);

  useEffect(() => {
    if (!activePlan?.id || !currentStop) return undefined;

    const timer = setTimeout(() => {
      onGenerateSuggestions();
    }, 3000);

    const interval = setInterval(() => {
      onGenerateSuggestions();
    }, 2 * 60 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [activePlan?.id, currentStop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistPlanMeta = async (nextName, nextBudget) => {
    if (!activePlan?.id) return;

    try {
      const { data, error } = await supabase
        .from("trip_plans")
        .update({
          plan_name: nextName,
          total_budget: nextBudget ? Number(nextBudget) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activePlan.id)
        .eq("user_id", user.uid)
        .select()
        .single();

      if (error) throw error;
      setActivePlan(data);
    } catch (error) {
      console.error("Failed to update plan meta:", error);
      setStatusText(`Plan update failed: ${error.message}`);
    }
  };

  const createLegacyActiveTripForStop = async (stop) => {
    try {
      const payload = {
        user_id: user.uid,
        destination: stop.city,
        origin: null,
        flight_number: stop.flight_number || null,
        departure_time: stop.arrival_date || null,
        arrival_time: stop.departure_date || null,
        status: "scheduled",
        itinerary: [],
      };

      const { data: tripData, error } = await supabase.from("active_trips").insert(payload).select().single();
      if (error) throw error;

      setTrip({
        ...tripData,
        destination: stop.city,
        travel_purpose: stop.purpose,
        interests: stop.preferences || [],
      });
      return tripData;
    } catch (error) {
      console.error("Failed to create legacy active trip:", error);
      setStatusText(`Monitoring bootstrap failed: ${error.message}`);
      return null;
    }
  };

  const handleAddStop = async () => {
    if (!user?.uid || !stopForm.city.trim()) return;

    setAddStopLoading(true);
    setSetupLoading(true);
    setStatusText("");

    try {
      let nextPlan = activePlan;
      if (!nextPlan?.id) {
        nextPlan = await createTripPlan(user.uid, planName, totalBudget);
        setActivePlan(nextPlan);
      }

      const newStop = await addTripStop(nextPlan.id, user.uid, {
        ...stopForm,
        city: stopForm.city.trim(),
        preferences: stopForm.preferences
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      const updatedStops = [...stops, newStop].sort((a, b) => a.stop_order - b.stop_order);
      setStops(updatedStops);
      setShowAddStop(false);
      setExpandedStopId(newStop.id);
      refreshCurrentStopIndex(updatedStops);
      setDashboardView("detail");

      await createSoloPost(user.uid, {
        destination: newStop.city,
        travel_date: newStop.arrival_date,
        travel_purpose: newStop.purpose || "leisure",
        budget_range: "mid",
        interests: newStop.preferences || [],
        gender_pref: "any",
      });

      if (newStop.flight_number) {
        const legacyTrip = await createLegacyActiveTripForStop(newStop);
        if (legacyTrip?.id) {
          start(nextPlan.id, newStop.id, user.uid, legacyTrip.id, newStop.flight_number);
        }
        await notificationService.createNotification(
          user.uid,
          "Trip Stop Added",
          `Flight monitoring started for ${newStop.city}.`,
          "info"
        );
      }

      setStopForm({
        city: currentCity || "Bengaluru",
        destination_detail: "",
        arrival_date: "",
        departure_date: "",
        flight_number: "",
        purpose: "leisure",
        budget_for_stop: "",
        preferences: "Food,Culture",
        notes: "",
      });
      setStatusText(`Stop added: ${newStop.city}`);
    } catch (error) {
      console.error("Failed to add stop:", error);
      setStatusText(`Add stop failed: ${error.message}`);
    } finally {
      setAddStopLoading(false);
      setSetupLoading(false);
    }
  };

  const onGenerateItinerary = async () => {
    if (!activePlan?.id || !stops.length) return;

    setIsGeneratingItinerary(true);
    setStatusText("AI is planning your journey...");

    try {
      const items = await generateItinerary(activePlan.id, user.uid, stops, totalBudget || activePlan.total_budget || 0);
      setItineraryItems(items);
      setStatusText(`Itinerary generated with ${items.length} items.`);
      setAllPlans((prev) =>
        prev.map((plan) => (plan.id === activePlan?.id ? { ...plan, updated_at: new Date().toISOString() } : plan))
      );
    } catch (error) {
      console.error("Itinerary generation failed:", error);
      setStatusText(`Itinerary generation failed: ${error.message}`);
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const onCheckLiveStatus = async () => {
    if (!currentStop || !currentStop?.flight_number) {
      setStatusText("Add a valid flight number to use live disruption checks.");
      return;
    }

    setReflowLoading(true);
    setStatusText("Checking live flight status...");

    try {
      const result = await checkNow(activePlan?.id, currentStop.id, user.uid, trip?.id, currentStop?.flight_number);

      if (!result) {
        setDisruptionResult(null);
        setStatusText("No live disruption detected. Flight is currently on schedule.");
        return;
      }

      setDisruptionResult(result);

      if (Array.isArray(result?.reflowedItems) && result.reflowedItems.length) {
        const itemMap = new Map(result.reflowedItems.map((item) => [item.id, item]));
        setItineraryItems((current) => current.map((item) => itemMap.get(item.id) || item));
        setUpdatedItemIds(result.reflowedItems.map((item) => item.id));
        setUpdateBanner(`Itinerary Updated: ${result.reflowedItems.length} items shifted by ${result.delayMinutes} minutes.`);
      }

      setStatusText("Live disruption detected and itinerary updated.");
    } catch (error) {
      console.error("Live disruption check failed:", error);
      setStatusText(`Live check failed: ${error.message}`);
    } finally {
      setReflowLoading(false);
    }
  };

  const onMarkStopCompleted = async (stop) => {
    try {
      const updated = await markStopCompleted(stop.id, user.uid);
      const nextStops = stops.map((row) => (row.id === updated.id ? updated : row));
      setStops(nextStops);
      refreshCurrentStopIndex(nextStops);
      setStatusText(`${stop.city} marked as completed.`);
    } catch (error) {
      console.error("Mark stop completed failed:", error);
      setStatusText(`Stop completion failed: ${error.message}`);
    }
  };

  const onMarkItemCompleted = async (itemId) => {
    try {
      const updated = await markItineraryItemCompleted(itemId, user.uid);
      setItineraryItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      console.error("Mark item completed failed:", error);
      setStatusText(`Item completion failed: ${error.message}`);
    }
  };

  const onGenerateSuggestions = async () => {
    if (!currentStop) return;

    setSuggestionsLoading(true);
    try {
      const stopItems = itineraryItems
        .filter((item) => item.stop_id === currentStop.id)
        .map((item) => ({ start: item.scheduled_start, end: item.scheduled_end }));

      const freeTime = stopItems.length ? detectFreeTime(stopItems) : 120;
      const loc = location || { lat: 12.9716, lon: 77.5946 };
      const data = await getSuggestions(
        loc,
        currentStop.city,
        freeTime,
        currentStop.preferences || ["Food", "Culture"],
        currentStop.purpose || "leisure"
      );
      setSuggestions(data);
      await pushSuggestionNotification(user.uid, data);
    } catch (error) {
      console.error("Suggestion generation failed:", error);
      setStatusText(`Suggestion generation failed: ${error.message}`);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const onFindMatches = async () => {
    if (!currentStop) return;

    setMatchesLoading(true);
    try {
      const profile = {
        destination: currentStop.city,
        travel_purpose: currentStop.purpose || "leisure",
        budget_range: "mid",
        interests: currentStop.preferences || [],
      };
      const result = await findMatches(user.uid, profile);
      setMatches(result);
      if (result.length) {
        await notificationService.createNotification(
          user.uid,
          "Travel Buddy Matches",
          `${result.length} potential matches found in ${currentStop.city}.`,
          "match"
        );
      }
    } catch (error) {
      console.error("Matching failed:", error);
      setStatusText(`Matching failed: ${error.message}`);
    } finally {
      setMatchesLoading(false);
    }
  };

  const onConnect = async (match) => {
    try {
      await notificationService.createNotification(
        user.uid,
        "Connection Requested",
        `You sent a connect request to ${match.user?.name || "a traveler"}.`,
        "match"
      );
      setStatusText("Connect request recorded as notification.");
    } catch (error) {
      console.error("Connect failed:", error);
      setStatusText(`Connect failed: ${error.message}`);
    }
  };

  const allStopsCompleted = stops.length > 0 && stops.every((stop) => stop.is_completed);

  const totalSpendEstimate = itineraryItems.reduce((sum, item) => sum + Number(item.budget_estimate || 0), 0);

  const tripDateSummary = useMemo(() => {
    if (!stops.length) return "-";
    const start = stops
      .map((s) => s.arrival_date)
      .filter(Boolean)
      .sort()[0];
    const end = stops
      .map((s) => s.departure_date)
      .filter(Boolean)
      .sort()
      .slice(-1)[0];
    return `${start || "-"} to ${end || "-"}`;
  }, [stops]);

  const renderItemIcon = (type) => {
    const Icon = ITEM_ICON_MAP[type] || MapPin;
    return <Icon className="h-4 w-4" />;
  };

  const itemsByStop = (stopId) =>
    itineraryItems.filter((item) => item.stop_id === stopId).sort((a, b) => a.item_order - b.item_order);

  if (dashboardView === "list") {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
              My Trips
            </h1>
            <p className="mt-1 text-slate-400">
              {allPlans.length === 0
                ? "No trips planned yet"
                : `${allPlans.length} trip${allPlans.length > 1 ? "s" : ""} planned`}
            </p>
          </div>
          <button
            onClick={handleCreateNewPlan}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 font-medium text-white shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-400"
          >
            <Plus size={18} />
            Create New Trip
          </button>
        </div>

        {loadingPlans ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-800/50" />
            ))}
          </div>
        ) : null}

        {!loadingPlans && allPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
              <MapPin size={32} className="text-teal-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Plan your first trip</h3>
            <p className="mb-6 max-w-sm text-slate-400">
              Add multiple destinations, get an AI-generated itinerary, and let TravelMind handle disruptions
              automatically.
            </p>
            <button
              onClick={handleCreateNewPlan}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 font-medium text-white transition-all hover:bg-teal-400"
            >
              <Plus size={18} />
              Create Your First Trip
            </button>
          </div>
        ) : null}

        {!loadingPlans && allPlans.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allPlans.map((plan) => {
              const { stops: planStops, completed, cities, firstDate, lastDate, hasDelay } = getPlanSummary(plan);
              const progress = planStops.length > 0 ? Math.round((completed / planStops.length) * 100) : 0;
              return (
                <div
                  key={plan.id}
                  onClick={() => openPlan(plan.id)}
                  className="group relative cursor-pointer rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-teal-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-teal-500/10"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        plan.status === "active"
                          ? "bg-teal-500/20 text-teal-400"
                          : plan.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-slate-600/50 text-slate-400"
                      }`}
                    >
                      {plan.status?.charAt(0).toUpperCase() + plan.status?.slice(1)}
                    </span>
                    {hasDelay ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400">
                        <AlertTriangle size={10} />
                        Disruption
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mb-1 text-lg font-semibold text-white transition-colors group-hover:text-teal-300">
                    {plan.plan_name}
                  </h3>

                  {cities ? <p className="mb-3 truncate text-sm text-teal-400/80">{cities}</p> : null}

                  {firstDate ? (
                    <p className="mb-4 text-xs text-slate-400">
                      {formatDate(firstDate)}
                      {lastDate && lastDate !== firstDate ? ` -> ${formatDate(lastDate)}` : ""}
                    </p>
                  ) : null}

                  {planStops.length > 0 ? (
                    <div className="mb-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-400">
                        <span>
                          {completed}/{planStops.length} stops done
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                        <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ) : null}

                  {plan.total_budget ? (
                    <p className="text-xs text-slate-400">
                      Budget: ₹{Number(plan.total_budget).toLocaleString("en-IN")}
                    </p>
                  ) : null}

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronRight size={20} className="text-teal-400" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to My Trips
        </button>
        {activePlan ? (
          <>
            <span className="text-slate-600">&middot;</span>
            <span className="text-sm text-slate-300">{activePlan.plan_name}</span>
          </>
        ) : null}
      </div>

      {!activePlan ? (
        <section className="glass-card space-y-4 p-5">
          <h3 className="font-heading text-2xl">Create Your Multi-Stop Plan</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Plan Name"
            />
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="Total Budget (INR)"
              type="number"
              min="0"
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-primary"
            onClick={() => setShowAddStop(true)}
          >
            Start Adding Stops
          </button>
        </section>
      ) : (
        <section className="glass-card space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <input
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xl font-semibold"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                onBlur={() => persistPlanMeta(planName, totalBudget)}
              />
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span>Budget: ₹{totalBudget || activePlan.total_budget || 0}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusClass(activePlan.status)}`}>
                  {activePlan.status}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm"
                onClick={() => setShowAddStop((prev) => !prev)}
              >
                Add Another Stop
              </button>
              <button
                type="button"
                className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-primary disabled:opacity-60"
                onClick={onGenerateItinerary}
                disabled={isGeneratingItinerary || !stops.length}
              >
                {isGeneratingItinerary ? "Generating..." : "Generate / Regenerate Itinerary"}
              </button>
            </div>
          </div>
          {isGeneratingItinerary ? (
            <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-accent" />
              AI is planning your journey...
            </div>
          ) : null}
        </section>
      )}

      {showAddStop ? (
        <section className="glass-card space-y-3 p-5">
          <h4 className="font-heading text-lg">Add Trip Stop</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              placeholder="City"
              value={stopForm.city}
              onChange={(e) => setStopForm((prev) => ({ ...prev, city: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              placeholder="Destination Detail"
              value={stopForm.destination_detail}
              onChange={(e) => setStopForm((prev) => ({ ...prev, destination_detail: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              type="date"
              value={stopForm.arrival_date}
              onChange={(e) =>
                setStopForm((prev) => {
                  const nextArrival = e.target.value;
                  const needsResetDeparture =
                    prev.departure_date && nextArrival && prev.departure_date < nextArrival;
                  return {
                    ...prev,
                    arrival_date: nextArrival,
                    departure_date: needsResetDeparture ? nextArrival : prev.departure_date,
                  };
                })
              }
            />
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              type="date"
              value={stopForm.departure_date}
              min={stopForm.arrival_date || undefined}
              onChange={(e) => setStopForm((prev) => ({ ...prev, departure_date: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              placeholder="Flight Number (optional)"
              value={stopForm.flight_number}
              onChange={(e) => setStopForm((prev) => ({ ...prev, flight_number: e.target.value }))}
            />
            <select
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              value={stopForm.purpose}
              onChange={(e) => setStopForm((prev) => ({ ...prev, purpose: e.target.value }))}
            >
              {PURPOSES.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {purpose}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              type="number"
              min="0"
              placeholder="Budget for this stop (INR)"
              value={stopForm.budget_for_stop}
              onChange={(e) => setStopForm((prev) => ({ ...prev, budget_for_stop: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              placeholder="Preferences (comma separated)"
              value={stopForm.preferences}
              onChange={(e) => setStopForm((prev) => ({ ...prev, preferences: e.target.value }))}
            />
            <textarea
              className="md:col-span-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
              placeholder="Notes"
              value={stopForm.notes}
              onChange={(e) => setStopForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <button
            type="button"
            disabled={addStopLoading}
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-primary disabled:opacity-60"
            onClick={handleAddStop}
          >
            {addStopLoading ? "Adding stop..." : "Add Stop"}
          </button>
        </section>
      ) : null}

      {stops.length ? (
        <section className="glass-card space-y-3 p-5">
          <h4 className="font-heading text-xl">Trip Timeline</h4>
          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
            {stops.map((stop, idx) => {
              const stopItems = itemsByStop(stop.id);
              const expanded = expandedStopId === stop.id;
              const isCurrent = idx === currentStopIndex;

              return (
                <article key={stop.id} className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                        {idx + 1}
                      </span>
                      <div>
                        <h5 className="text-lg font-semibold">{stop.city}</h5>
                        <p className="text-sm text-slate-300">{stop.destination_detail || "-"}</p>
                        <p className="text-xs text-slate-400">
                          {stop.arrival_date || "-"} → {stop.departure_date || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {stop.flight_number ? (
                        <span className={`rounded-full px-2 py-1 ${getStatusClass(stop.flight_status)}`}>
                          {stop.flight_number} • {stop.flight_status}
                        </span>
                      ) : null}
                      {stop.purpose ? <span className="rounded-full bg-slate-800 px-2 py-1">{stop.purpose}</span> : null}
                      <span className="rounded-full bg-slate-800 px-2 py-1">₹{stop.budget_for_stop || 0}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!stop.is_completed && isCurrent ? (
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-sm text-emerald-300"
                        onClick={() => onMarkStopCompleted(stop)}
                      >
                        Mark as Completed
                      </button>
                    ) : null}

                    {stop.is_completed ? (
                      <span className="flex items-center gap-1 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-sm text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </span>
                    ) : null}

                    <button
                      type="button"
                      className="ml-auto rounded-lg border border-slate-600 px-2 py-1"
                      onClick={() => setExpandedStopId((prev) => (prev === stop.id ? null : stop.id))}
                    >
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {expanded ? (
                    <div className="mt-3 space-y-2">
                      {stopItems.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-lg border border-slate-700 p-2 text-sm ${
                            item.is_completed ? "opacity-70" : ""
                          } ${updatedItemIds.includes(item.id) ? "itinerary-updated" : ""}`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-400">
                              {formatDate(item.scheduled_start)} → {formatDate(item.scheduled_end)}
                            </span>
                            <span className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs">
                              {renderItemIcon(item.item_type)}
                              {item.item_type || "activity"}
                            </span>
                            <span className="ml-auto text-xs text-slate-300">₹{item.budget_estimate || 0}</span>
                          </div>
                          <p className={`${item.is_completed ? "line-through" : ""} mt-1 font-medium`}>{item.title}</p>
                          <p className="text-xs text-slate-300">{item.location || "-"}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-400">{formatDuration(item.duration_minutes)}</span>
                            {!item.is_completed ? (
                              <button
                                type="button"
                                className="rounded bg-emerald-600/20 px-2 py-1 text-xs text-emerald-300"
                                onClick={() => onMarkItemCompleted(item.id)}
                              >
                                Mark Done
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {!stopItems.length ? <p className="text-sm text-slate-400">No itinerary items yet.</p> : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {updateBanner ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {updateBanner}
        </div>
      ) : null}

      {allStopsCompleted ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <p className="font-semibold">Trip Completed!</p>
          <p>Cities visited: {stops.map((stop) => stop.city).join(", ")}</p>
          <p>Total spend estimate: ₹{Math.round(totalSpendEstimate)}</p>
          <p>Date range: {tripDateSummary}</p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <DisruptionMonitor
          agentState={agentState}
          onCheckLive={onCheckLiveStatus}
          statusText={reflowLoading ? "Reflowing itinerary..." : statusText}
          disruptionResult={disruptionResult}
          loading={setupLoading || reflowLoading}
        />

        <ProactiveSuggestions
          suggestions={suggestions}
          onGenerate={onGenerateSuggestions}
          loading={suggestionsLoading}
          city={currentCity}
        />

        <GroupMatchList
          matches={matches}
          onFind={onFindMatches}
          onConnect={onConnect}
          loading={matchesLoading}
          city={currentCity}
        />
      </div>

      <AIAssistantPanel city={currentCity} />
    </div>
  );
}
