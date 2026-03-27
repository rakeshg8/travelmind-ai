import { AlertTriangle, Plane, Radar, Sparkles } from "lucide-react";
import { formatDate } from "../../utils/helpers";

export default function DisruptionMonitor({ agentState, onCheckLive, statusText, disruptionResult, loading }) {
  const activeDisruption = Boolean(disruptionResult);
  const issueLabel = "Live disruption detected";
  const reasoningLabel = "AI reasoning";

  return (
    <section className={`glass-card p-4 ${activeDisruption ? "animate-pulse-border border border-danger" : ""}`}>
      <h3 className="mb-3 flex items-center gap-2 font-heading text-lg">
        <Radar className="text-accent" />
        Disruption Monitor
      </h3>

      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-success animate-breathe" />
        <span>Agent Status: {agentState.status || "idle"}</span>
      </div>

      <p className="text-sm text-slate-300">Last Checked: {formatDate(agentState.lastChecked)}</p>
      <p className="mb-3 text-sm text-slate-300">Flight: {agentState.flightNumber || "Not configured"}</p>

      <button
        type="button"
        onClick={onCheckLive}
        disabled={loading}
        className="mb-4 w-full rounded-xl bg-danger px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Check Live Flight Status
      </button>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-200">Action Log</h4>
        <div className="max-h-40 space-y-2 overflow-auto text-xs">
          {(agentState.actions || []).slice(0, 6).map((item, idx) => (
            <div key={`${idx}-${item.timestamp}`} className="rounded-lg bg-slate-800/70 p-2">
              <p>{item.message}</p>
              <p className="text-slate-400">{formatDate(item.timestamp)}</p>
            </div>
          ))}
          {!agentState.actions?.length ? <p className="text-slate-400">No activity yet.</p> : null}
        </div>
      </div>

      {statusText ? <p className="mt-3 text-xs text-accent">{statusText}</p> : null}

      {disruptionResult ? (
        <div className="mt-4 animate-slide-up rounded-xl border border-danger/50 bg-danger/10 p-3">
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" />
            {issueLabel}
          </h4>
          <p className="mb-2 text-sm">{disruptionResult.summary || disruptionResult.recommendation}</p>
          {disruptionResult.issueContext ? <p className="mb-2 text-xs text-slate-300">Context: {disruptionResult.issueContext}</p> : null}
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-300">{reasoningLabel}</p>
          <p className="typewriter mb-3 text-sm">{disruptionResult.recommendation}</p>
          <div className="space-y-2">
            {(disruptionResult.alternatives || []).map((item, idx) => (
              <div key={idx} className="rounded-lg bg-slate-900/70 p-2 text-sm">
                <p className="font-medium">Option {idx + 1}: {item.option || item.title}</p>
                <p className="text-slate-300">ETA: {item.eta || item.time || "Not provided"}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-2 text-sm">
            <p className="flex items-center gap-1 font-semibold text-accent"><Sparkles className="h-4 w-4" />Recommended action</p>
            <p>{disruptionResult.recommendation}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-slate-800/60 p-3 text-xs text-slate-300">
          <Plane className="mb-1 h-4 w-4" />
          No live disruption currently. Trigger a live status check or keep monitoring enabled.
        </div>
      )}
    </section>
  );
}
