import { formatTime } from "../format";

// The one thing on the dashboard that should win the eye: what to do next.
// The dot beside the headline carries the job's urgency.
const JOB = {
  restock: { label: "Restock the storefront", dot: "bg-signal-stop" },
  collection: { label: "Collection sweep", dot: "bg-signal-watch" },
  idle: { label: "Nothing urgent", dot: "bg-signal-go" },
  delivery: { label: "Delivery run", dot: "bg-signal-route" },
  full: { label: "Bay already full", dot: "bg-signal-go" },
};

function Figure({ label, value, unit }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-0.5 text-3xl font-semibold">
        {value}
        {unit && <span className="text-lg font-normal text-haze-500"> {unit}</span>}
      </dd>
    </div>
  );
}

function Notice({ children }) {
  return (
    <p className="mt-4 rounded-md border border-signal-watch/40 bg-signal-watch/10 px-3 py-2.5 text-sm text-signal-watch">
      {children}
    </p>
  );
}

function JobPanel({
  className = "",
  route,
  loading,
  error,
  stale,
  depot,
  bays,
  busy,
  simulating,
  onChooseBay,
  onPlan,
  onSimulate,
}) {
  const job = route ? JOB[route.job] || { label: route.job, dot: "bg-haze-300" } : null;

  return (
    <section className={`panel p-5 sm:p-6 ${className}`} aria-label="Next job" aria-busy={loading}>
      {error && (
        <p role="alert" className="text-base text-signal-stop-text">
          {error}
        </p>
      )}

      {!error && !route && loading && (
        <div className="space-y-3" aria-label="Planning route">
          <div className="skeleton h-10 w-2/3" />
          <div className="skeleton h-5 w-1/2" />
          <div className="skeleton h-12 w-1/2" />
        </div>
      )}

      {!error && route && (
        <div className={`transition-opacity ${loading ? "opacity-50" : ""}`} aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              <span aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 rounded-full ${job.dot}`} />
              <span>
                <span className="sr-only">Next job: </span>
                {job.label}
              </span>
            </h2>
            {route.plannedAt && (
              <p className="text-sm text-haze-500">Planned at {formatTime(route.plannedAt)}</p>
            )}
          </div>
          <p className="mt-2 text-lg text-haze-300">{route.reason}</p>

          {route.optimizedRoute?.length > 0 && (
            <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
              <Figure label="Stops" value={route.corralsCovered} />
              <Figure label="Carts" value={route.cartsMoved ?? "—"} />
              <Figure
                label="Walk"
                value={route.totalDistance != null ? Math.round(route.totalDistance).toLocaleString() : "—"}
                unit="ft"
              />
            </dl>
          )}

          {stale && <Notice>Counts changed since this plan was made. Re-plan to use the new numbers.</Notice>}
          {route.degraded && <Notice>{route.note}</Notice>}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink-600 pt-5">
        {/* Auto lets the API decide the job; naming a bay forces a delivery
            run to it. Bays are listed left to right, as on the map. */}
        <div className="flex flex-wrap items-center gap-3">
          <span id="bay-label" className="label">
            Drop off at
          </span>
          <div role="group" aria-labelledby="bay-label" className="segmented">
            <button
              onClick={() => onChooseBay(null)}
              aria-pressed={depot === null}
              disabled={busy}
              className="segment"
            >
              Auto
            </button>
            {bays.map((c) => (
              <button
                key={c.id}
                onClick={() => onChooseBay(c.id)}
                aria-pressed={depot === c.id}
                disabled={busy}
                className="segment"
              >
                {c.label || c.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSimulate}
            disabled={busy}
            title="Randomise the lot to a plausible state, then re-plan"
            className="chip"
          >
            {simulating ? "Simulating…" : "Simulate"}
          </button>
          <button onClick={onPlan} disabled={busy} className="btn">
            {loading ? "Planning…" : stale ? "Re-plan with new counts" : route ? "Re-plan" : "Plan route"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default JobPanel;
