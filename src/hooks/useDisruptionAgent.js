import { useEffect, useState } from "react";
import {
  getDisruptionState,
  subscribeDisruptionState,
  startMonitoring,
  stopMonitoring,
  checkAndHandleLiveDisruption,
} from "../services/disruptionAgent";

export function useDisruptionAgent(tripId, flightNumber) {
  const [agentState, setAgentState] = useState(getDisruptionState());

  useEffect(() => {
    const unsubscribe = subscribeDisruptionState(setAgentState);
    return () => unsubscribe();
  }, []);

  const begin = (planId, stopId, userId, overrideTripId, overrideFlightNumber) => {
    const effectiveTripId = overrideTripId || tripId;
    const effectiveFlight = overrideFlightNumber || flightNumber;
    if (!effectiveTripId) return;
    startMonitoring(effectiveTripId, effectiveFlight, planId, stopId, userId);
  };

  const stop = () => {
    if (!tripId) return;
    stopMonitoring(tripId);
  };

  const checkNow = (planId, stopId, userId, overrideTripId, overrideFlightNumber) => {
    const effectiveTripId = overrideTripId || tripId;
    const effectiveFlight = overrideFlightNumber || flightNumber;
    return checkAndHandleLiveDisruption(effectiveTripId, effectiveFlight, planId, stopId, userId);
  };

  return {
    agentState,
    start: begin,
    stop,
    checkNow,
  };
}
