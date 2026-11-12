import layout from "../../../shared/layout.json";
import { colors } from "../theme/colors";
import { STATUS, statusFor, tint } from "../lotStatus";

// Drawn in feet, the same units the optimizer solves in, so the picture cannot
// drift away from the route it is illustrating.
const PAD_X = 80; // room on the right for the "50 ft" dimension label
const PAD_TOP = 124;
const PAD_BOTTOM = 62;

const xs = layout.corrals.map((c) => c.x);
const ys = layout.corrals.map((c) => c.y);
const MIN_X = Math.min(...xs);
const MAX_X = Math.max(...xs);
const MIN_Y = Math.min(...ys);
const MAX_Y = Math.max(...ys);

const VIEW_W = MAX_X - MIN_X + PAD_X * 2;
const VIEW_H = MAX_Y - MIN_Y + PAD_TOP + PAD_BOTTOM;

const px = (x) => x - MIN_X + PAD_X;
const py = (y) => y - MIN_Y + PAD_TOP;

// Corral boxes are symbolic, not to scale. They are sized so the letter and
// count stay readable on an iPad from a step back.
const RETURN_W = 74;
const RETURN_H = 44;
const SUPPLY_H = 44;

// Tap areas are bigger than the boxes: a full row tall (rows are 50 ft apart)
// and most of a column wide, so a finger does not have to land on the box.
const HIT_H = layout.spacing.row;
const HIT_RETURN_W = 116;

const COLUMN = layout.spacing.column;
const COLUMNS = Math.round((MAX_X - MIN_X) / COLUMN) + 1;

// Drawing-only colors: asphalt, paint, and the building.
const MAP = {
  ground: "#1b1c20",
  paint: "rgb(255 255 255 / 0.12)",
  store: "#222428",
  storeEdge: "#33353b",
  count: "#c9cbd1", // a step brighter than haze-300 so it holds 4.5:1 on the red tint
  dimension: "#4a4d54",
};

const fillFor = (status) => (status.hollow ? MAP.ground : tint(status.color, status.tint, MAP.ground));

function LotMap({ counts = {}, route = [], selected, onSelect }) {
  const byId = Object.fromEntries(layout.corrals.map((c) => [c.id, c]));

  const stops = route.map((id) => byId[id]).filter(Boolean);
  const routeActive = stops.length > 1;
  const routePath = routeActive
    ? stops.map((c, i) => `${i === 0 ? "M" : "L"} ${px(c.x)},${py(c.y)}`).join(" ")
    : "";

  // One arrowhead in the middle of each long leg shows which way to walk.
  const arrows = routeActive
    ? stops.slice(1).map((b, i) => {
        const a = stops[i];
        const [ax, ay, bx, by] = [px(a.x), py(a.y), px(b.x), py(b.y)];
        if (Math.hypot(bx - ax, by - ay) < 60) return null;
        const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
        return (
          <path
            key={i}
            d="M -7 -6 L 7 0 L -7 6 Z"
            transform={`translate(${(ax + bx) / 2} ${(ay + by) / 2}) rotate(${angle})`}
            fill={colors.signal.route}
          />
        );
      })
    : null;

  const supply = layout.corrals.filter((c) => c.type === "supply");

  return (
    <div className="overflow-x-auto rounded-lg">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full min-w-[620px] h-auto select-none"
        role="group"
        aria-label="Overhead map of the store lot. Each corral is a button."
      >
        <rect width={VIEW_W} height={VIEW_H} fill={MAP.ground} />

        {/* The building along the top edge, with its doors marked where the
            storefront corrals sit. */}
        <g aria-hidden="true">
          <rect
            x={PAD_X - 44}
            y={14}
            width={MAX_X - MIN_X + 88}
            height={46}
            rx="4"
            fill={MAP.store}
            stroke={MAP.storeEdge}
            strokeWidth="1.5"
          />
          <text x={VIEW_W / 2} y={43} textAnchor="middle" fill={colors.haze[500]} fontSize="15" fontWeight="600">
            Store
          </text>
          {supply.map((c) => (
            <rect key={c.id} x={px(c.x) - 16} y={56} width={32} height={4} rx="1" fill={colors.haze[500]} />
          ))}
        </g>

        {/* Painted lane lines between the columns of corrals. */}
        <g stroke={MAP.paint} strokeWidth="2" strokeDasharray="12 10" aria-hidden="true">
          {Array.from({ length: COLUMNS - 1 }, (_, k) => {
            const x = px(MIN_X + k * COLUMN + COLUMN / 2);
            return <line key={k} x1={x} x2={x} y1={py(0) - 30} y2={py(MAX_Y) + 30} />;
          })}
        </g>

        {routePath && (
          <g aria-hidden="true">
            <path
              d={routePath}
              fill="none"
              stroke={colors.signal.route}
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {arrows}
          </g>
        )}

        {layout.corrals.map((c) => {
          const count = counts[c.id] ?? 0;
          const isSupply = c.type === "supply";
          const w = isSupply ? c.width : RETURN_W;
          const h = isSupply ? SUPPLY_H : RETURN_H;
          const statusKey = statusFor(c.id, count);
          const status = STATUS[statusKey];
          const isSelected = selected === c.id;
          const order = route.indexOf(c.id);
          const inRoute = order >= 0;
          const cx = px(c.x);
          const cy = py(c.y);
          const top = cy - h / 2;
          const hitW = isSupply ? w + 30 : HIT_RETURN_W;

          // A soft tint of the status color with a border in the full color.
          // On the route, the border turns blue; selected, it turns white.
          let stroke = status.color;
          let strokeWidth = 1.5;
          if (inRoute) [stroke, strokeWidth] = [colors.signal.route, 2.5];
          if (isSelected) [stroke, strokeWidth] = [colors.haze[100], 3];

          const select = () => onSelect?.(c.id);

          return (
            <g
              key={c.id}
              onClick={select}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault(); // Space would otherwise scroll the page
                  select();
                }
              }}
              className="corral cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={[
                `Corral ${c.id}`,
                c.label,
                `${count}${isSupply && c.capacity ? ` of ${c.capacity}` : ""} carts`,
                status.label,
                inRoute && order > 0 && order < route.length - 1 ? `stop ${order} on the route` : null,
              ]
                .filter(Boolean)
                .join(", ")}
            >
              <rect x={cx - hitW / 2} y={cy - HIT_H / 2} width={hitW} height={HIT_H} fill="transparent" />
              {isSelected && (
                <rect
                  x={cx - w / 2 - 6}
                  y={top - 6}
                  width={w + 12}
                  height={h + 12}
                  rx="9"
                  fill="none"
                  stroke={colors.haze[100]}
                  strokeWidth="1.5"
                  opacity="0.4"
                />
              )}
              <rect
                className="corral-box"
                x={cx - w / 2}
                y={top}
                width={w}
                height={h}
                rx="6"
                fill={fillFor(status)}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={status.hollow && !inRoute && !isSelected ? "5 4" : undefined}
              />
              <text x={cx} y={cy - 2} textAnchor="middle" fill={colors.haze[100]} fontSize="20" fontWeight="700">
                {c.id}
              </text>
              <text x={cx} y={cy + 16} textAnchor="middle" fill={MAP.count} fontSize="15" fontWeight="500">
                {count}
                {isSupply && c.capacity ? `/${c.capacity}` : ""}
              </text>

              {/* Storefront corrals are named; lot corrals go by letter alone. */}
              {isSupply && c.label && (
                <text x={cx} y={top - 12} textAnchor="middle" fill={colors.haze[300]} fontSize="15" fontWeight="500">
                  {c.label}
                </text>
              )}

              {/* Needs action gets a mark as well as the red, so it does not
                  depend on telling red from green. Badges sit inside the box's
                  top corners so they can never overlap a neighbour. */}
              {statusKey === "critical" && (
                <g aria-hidden="true">
                  <circle
                    cx={cx - w / 2 + 12}
                    cy={top + 12}
                    r="9"
                    fill={colors.ink[900]}
                    stroke={colors.signal["stop-text"]}
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx - w / 2 + 12}
                    y={top + 17}
                    textAnchor="middle"
                    fill={colors.signal["stop-text"]}
                    fontSize="14"
                    fontWeight="700"
                  >
                    !
                  </text>
                </g>
              )}

              {/* Position in the walking order (not on the start and end bay). */}
              {inRoute && order > 0 && order < route.length - 1 && (
                <g aria-hidden="true">
                  <circle cx={cx + w / 2 - 12} cy={top + 12} r="10" fill={colors.accent.DEFAULT} />
                  <text
                    x={cx + w / 2 - 12}
                    y={top + 16.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {order}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Real dimensions, so the schematic reads as a measured lot. */}
        <g stroke={MAP.dimension} strokeWidth="1.5" fill={colors.haze[500]} fontSize="13" aria-hidden="true">
          <line x1={px(0)} y1={py(MAX_Y) + 38} x2={px(130)} y2={py(MAX_Y) + 38} />
          <line x1={px(0)} y1={py(MAX_Y) + 33} x2={px(0)} y2={py(MAX_Y) + 43} />
          <line x1={px(130)} y1={py(MAX_Y) + 33} x2={px(130)} y2={py(MAX_Y) + 43} />
          <text x={px(65)} y={py(MAX_Y) + 55} textAnchor="middle" stroke="none">
            130 ft
          </text>
          <line x1={px(MAX_X) + 42} y1={py(0)} x2={px(MAX_X) + 42} y2={py(50)} />
          <text x={px(MAX_X) + 47} y={py(25) + 5} stroke="none">
            50 ft
          </text>
        </g>
      </svg>
    </div>
  );
}

function Swatch({ fill, stroke, dashed }) {
  return (
    <svg width="14" height="14" aria-hidden="true" className="shrink-0">
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="3"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeDasharray={dashed ? "3 2" : undefined}
      />
    </svg>
  );
}

// Lives next to the map so the legend and the drawing read the same STATUS.
export function MapLegend({ routeActive }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-haze-300">
      {["good", "moderate", "critical", "empty"].map((key) => (
        <li key={key} className="flex items-center gap-1.5">
          <Swatch fill={fillFor(STATUS[key])} stroke={STATUS[key].color} dashed={STATUS[key].hollow} />
          {STATUS[key].label}
          {key === "critical" && <span className="font-bold text-signal-stop-text">!</span>}
        </li>
      ))}
      {routeActive && (
        <li className="flex items-center gap-1.5">
          <Swatch fill={MAP.ground} stroke={colors.signal.route} />
          On the route
        </li>
      )}
    </ul>
  );
}

export default LotMap;
