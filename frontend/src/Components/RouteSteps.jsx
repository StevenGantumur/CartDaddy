import { STATUS, statusFor } from "../lotStatus";

// The route as a plain numbered list a worker can follow down the page. The
// numbers match the badges on the map; each row opens that corral's sheet.
// It reads down each column, then across, like any list.
function RouteSteps({ className = "", route, lot, onOpen }) {
  const stops = route?.optimizedRoute || [];
  if (stops.length < 2) return null;

  const byId = Object.fromEntries(lot.corrals.map((c) => [c.id, c]));
  const last = stops.length - 1;

  return (
    <section className={`panel p-5 sm:p-6 ${className}`} aria-labelledby="steps-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="steps-title" className="text-lg font-semibold">
          Walking order
        </h2>
        <p className="text-sm text-haze-500">
          {last - 1} {last - 1 === 1 ? "stop" : "stops"}
          {route.method ? ` · solved with ${route.method}` : ""}
        </p>
      </div>

      <ol className="mt-3 gap-x-8 sm:columns-2 lg:columns-4">
        {stops.map((id, i) => {
          const corral = byId[id];
          const count = lot.counts[id] ?? 0;
          const statusKey = statusFor(id, count);
          const status = STATUS[statusKey];
          const isEnd = i === 0 || i === last;
          const role = i === 0 ? "Start" : i === last ? "End" : `Stop ${i}`;
          const capacity = corral?.type === "supply" && corral.capacity ? `/${corral.capacity}` : "";

          return (
            <li key={`${id}-${i}`} className="break-inside-avoid border-b border-ink-600">
              <button
                onClick={() => onOpen(id)}
                aria-label={`${role}: corral ${id}${corral?.label ? `, ${corral.label}` : ""}, ${count} carts, ${status.label}`}
                className="flex min-h-12 w-full items-center gap-3 rounded px-1 text-left transition-colors hover:bg-ink-700 active:bg-ink-700"
              >
                <span className="w-11 shrink-0">
                  {isEnd ? (
                    <span className="text-sm text-haze-500">{role}</span>
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-sm font-semibold text-white">
                      {i}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-lg font-semibold">{id}</span>
                  {corral?.label && <span className="ml-2 text-sm text-haze-300">{corral.label}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-sm text-haze-300">
                  {count}
                  {capacity}
                  {statusKey === "critical" && <span className="font-bold text-signal-stop-text">!</span>}
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={
                      status.hollow
                        ? { boxShadow: `inset 0 0 0 1.5px ${status.color}` }
                        : { background: status.color }
                    }
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default RouteSteps;
