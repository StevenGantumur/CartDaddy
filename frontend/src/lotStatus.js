import layout from "../../shared/layout.json";
import { colors } from "./theme/colors";

// One definition of "how urgent is this corral", shared by the map, its legend,
// the walking order, and the detail sheet, so they can never disagree.
// `color` is the status hue. On the map each corral is a soft tint of it with
// a border in the full color; `tint` is how strong that fill is, a little
// stronger the more urgent the status, so problems still stand out.
export const STATUS = {
  critical: { label: "Needs action", color: colors.signal.stop, tint: 0.3 },
  moderate: { label: "Watch", color: colors.signal.watch, tint: 0.2 },
  good: { label: "Healthy", color: colors.signal.go, tint: 0.16 },
  // Empty is a dashed outline with no fill.
  empty: { label: "Empty", color: colors.haze[500], tint: 0, hollow: true },
};

// Mixes a status color into a background at a given strength and returns a
// solid hex. Solid rather than see-through, so the route line drawn under a
// corral doesn't show through it.
export function tint(hex, amount, background) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [rgb(hex), rgb(background)];
  return "#" + a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount)).toString(16).padStart(2, "0")).join("");
}

const byId = Object.fromEntries(layout.corrals.map((c) => [c.id, c]));

// Return corrals are a problem when full.
const RETURN_FULL = 30;
const RETURN_WATCH = 15;
// Mirrors SUPPLY_LOW_WATER in backend/routes/optimize.js, used only when a
// supply corral has no lowWater of its own.
const SUPPLY_LOW_WATER_FALLBACK = 0.4;

// Supply corrals are a problem when empty. "Needs action" is the same lowWater
// number the route planner uses to trigger a restock, so a red bay on the map
// always means Plan Route will restock it. (The map used to use a flat 40%,
// which marked the Cart Tunnel red at 100 to 159 carts while the planner, using
// lowWater 100, said nothing was urgent.) "Watch" starts halfway back to full.
export function statusFor(id, count) {
  const corral = byId[id];
  if (!corral) return "good";

  if (corral.type === "supply") {
    const capacity = corral.capacity || 0;
    const low = corral.lowWater ?? capacity * SUPPLY_LOW_WATER_FALLBACK;
    if (count < low) return "critical";
    if (count < low + (capacity - low) / 2) return "moderate";
    return "good";
  }

  if (count >= RETURN_FULL) return "critical";
  if (count >= RETURN_WATCH) return "moderate";
  if (count === 0) return "empty";
  return "good";
}

// A one-line explanation of the threshold, for the detail sheet.
export function thresholdNote(id) {
  const corral = byId[id];
  if (!corral) return "";
  if (corral.type === "supply") {
    const low = corral.lowWater ?? Math.round((corral.capacity || 0) * SUPPLY_LOW_WATER_FALLBACK);
    return `Needs restocking below ${low} carts.`;
  }
  return `Watch from ${RETURN_WATCH} carts, needs collecting at ${RETURN_FULL}.`;
}
