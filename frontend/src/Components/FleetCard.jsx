import { colors } from "../theme/colors";

// Where all the carts are right now. A thin segmented bar shows the split at
// a glance; the figures underneath carry the exact numbers, and their color
// dots stand in for a legend.
function Figure({ label, value, swatch, sub, warn }) {
  return (
    <div>
      <dt className="label flex items-center gap-1.5">
        {swatch && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: swatch }} />}
        {label}
      </dt>
      <dd className="mt-0.5 text-3xl font-semibold">
        {value}
        {warn && <span className="text-signal-watch"> !</span>}
      </dd>
      {sub && <dd className={`text-sm ${warn ? "text-signal-watch" : "text-haze-500"}`}>{sub}</dd>}
    </div>
  );
}

function FleetCard({ className = "", building, corralCount }) {
  const { cartsInBuilding, cartsInLot, fleetSize, unaccounted } = building;
  const off = unaccounted !== 0;

  const parts = [
    { key: "building", label: "In the building", value: cartsInBuilding, color: colors.chart.building },
    { key: "lot", label: "In the lot", value: cartsInLot, color: colors.chart.lot },
    { key: "missing", label: "Unaccounted", value: Math.max(0, unaccounted), color: colors.signal.watch },
  ].filter((p) => p.value > 0);

  return (
    <section className={`panel p-5 sm:p-6 ${off ? "panel-warn" : ""} ${className}`} aria-labelledby="fleet-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="fleet-title" className="text-lg font-semibold">
          Carts
        </h2>
        <p className="text-sm text-haze-500">{fleetSize ?? "—"} in the fleet</p>
      </div>

      <div
        className="mt-4 flex h-2 gap-0.5"
        role="img"
        aria-label={parts.map((p) => `${p.value} ${p.label.toLowerCase()}`).join(", ")}
      >
        {parts.map((p) => (
          <div
            key={p.key}
            className="h-full rounded-full"
            style={{ flexGrow: p.value, flexBasis: 0, background: p.color }}
            title={`${p.label}: ${p.value}`}
          />
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 lg:grid-cols-2">
        <Figure swatch={colors.chart.building} label="In the building" value={cartsInBuilding} />
        <Figure swatch={colors.chart.lot} label="In the lot" value={cartsInLot} sub={`across ${corralCount} corrals`} />
        <Figure label="Fleet size" value={fleetSize ?? "—"} />
        <Figure
          label="Unaccounted"
          value={unaccounted}
          warn={off}
          sub={off ? "Counts don't add up" : "Every cart counted"}
        />
      </dl>
    </section>
  );
}

export default FleetCard;
