import { useEffect, useState } from "react";

import layout from "../../../shared/layout.json";
import { colors } from "../theme/colors";
import { STATUS, statusFor, thresholdNote } from "../lotStatus";
import UpdateForm from "./UpdateForm";
import LoginForm from "./LoginForm";

const LOW_WATER = Object.fromEntries(layout.corrals.map((c) => [c.id, c.lowWater]));

// Compact history plot. The endpoint returns newest first, so it is reversed to
// read left to right in time.
function Sparkline({ snapshots }) {
  const points = [...snapshots].reverse();
  const values = points.map((s) => s.cart_count);
  const max = Math.max(...values, 1);
  const W = 320;
  const H = 64;

  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - (v / max) * (H - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Stretched to the sheet's full width. non-scaling-stroke keeps the line 2px
  // thick instead of letting the stretch smear it.
  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-20"
        role="img"
        aria-label={`Last ${values.length} readings, from ${values[0]} to ${values.at(-1)} carts, peak ${max}`}
      >
        <path d={`${path} L ${W},${H} L 0,${H} Z`} fill={colors.signal.route} fillOpacity="0.12" />
        <path
          d={path}
          fill="none"
          stroke={colors.signal.route}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="text-xs text-haze-500 mt-1">
        Last {values.length} readings · peak {max}
      </p>
    </>
  );
}

// Capacity meter for storefront corrals: the fill carries the status, the
// track is a faint step of the same color, and a tick marks the restock line.
function Meter({ value, max, low, color }) {
  const pct = (n) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="relative h-2.5 rounded-full mt-4" style={{ background: `${color}33` }}>
      <div className="h-full rounded-full" style={{ width: pct(value), background: color }} />
      {low != null && (
        <div
          className="absolute -top-1 -bottom-1 w-0.5 bg-haze-100"
          style={{ left: pct(low) }}
          title={`Restock line: ${low}`}
        />
      )}
    </div>
  );
}

function History({ apiBase, corralId }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase}/api/corrals/${corralId}/history?limit=48`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Server responded ${res.status}`))))
      // A stale response from a previously opened corral must not overwrite
      // the current one, so late results are dropped.
      .then((data) => !cancelled && setHistory(data.snapshots))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [apiBase, corralId]);

  if (error) return <p className="text-sm text-signal-stop-text">Could not load history. {error}</p>;
  if (!history) return <div className="skeleton h-20" aria-label="Loading history" />;
  if (history.length < 2) {
    return (
      <p className="text-sm text-haze-500">
        {history.length === 1 ? "Only one reading so far." : "No history yet."}
      </p>
    );
  }
  return <Sparkline snapshots={history} />;
}

function CorralDetail({
  apiBase,
  corral,
  count,
  routeStop,
  routeStops,
  token,
  onUpdate,
  onAuthExpired,
  onLogin,
  onClose,
}) {
  const isSupply = corral.type === "supply";
  const statusKey = statusFor(corral.id, count);
  const status = STATUS[statusKey];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-haze-300">
            {corral.label || (isSupply ? "Storefront corral" : "Lot corral")}
          </p>
          <h2 className="mt-0.5 text-4xl font-semibold tracking-tight">Corral {corral.id}</h2>
        </div>
        <button onClick={onClose} className="chip -mr-1 px-3" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div>
        <p className="leading-none">
          <span className="text-6xl font-semibold">{count}</span>
          <span className="text-xl text-haze-500">
            {isSupply && corral.capacity ? ` / ${corral.capacity}` : ""} carts
          </span>
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={status.hollow ? { boxShadow: `inset 0 0 0 1.5px ${status.color}` } : { background: status.color }}
          />
          <span className="font-medium">{status.label}</span>
          {statusKey === "critical" && <span className="font-bold text-signal-stop-text">!</span>}
          {routeStop != null && (
            <span className="text-haze-300">
              · stop {routeStop} of {routeStops} on this route
            </span>
          )}
        </p>
        {isSupply && corral.capacity && (
          <Meter value={count} max={corral.capacity} low={LOW_WATER[corral.id]} color={status.color} />
        )}
        <p className="text-sm text-haze-500 mt-2">{thresholdNote(corral.id)}</p>
      </div>

      <div className="border-t border-ink-600 pt-5">
        {token ? (
          <UpdateForm
            key={corral.id}
            apiBase={apiBase}
            token={token}
            corral={corral}
            count={count}
            onUpdate={onUpdate}
            onAuthExpired={onAuthExpired}
          />
        ) : (
          <>
            <p className="mb-3 text-base font-semibold">Update count</p>
            <LoginForm apiBase={apiBase} onLogin={onLogin} />
          </>
        )}
      </div>

      <div className="border-t border-ink-600 pt-5">
        <p className="mb-2 text-base font-semibold">Recent history</p>
        <History key={corral.id} apiBase={apiBase} corralId={corral.id} />
      </div>
    </div>
  );
}

export default CorralDetail;
