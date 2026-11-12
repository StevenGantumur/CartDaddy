// The one palette for the whole frontend. Tailwind builds its classes from it
// (see tailwind.config.js) and the hand-drawn SVGs import it directly, so a
// color changed here changes everywhere. Same idea as shared/layout.json: one
// source of truth instead of copies that drift apart.
//
// Near-monochrome graphite, one accent (blue) for anything you interact with
// or follow, and status colors for corral state. Text colors are checked
// against WCAG AA (4.5:1 for normal text) on the surfaces they sit on.
export const colors = {
  ink: {
    950: "#0e0f11", // page
    900: "#0a0b0c", // darkest: badge backgrounds, dark text on light fills
    800: "#16171a", // panel
    700: "#1e1f23", // raised: inputs, buttons, segmented track
    600: "#26282d", // hairline borders, button hover
    500: "#33353b", // stronger hover
  },
  haze: {
    100: "#ededef", // primary text     14.1:1 on ink-700
    300: "#a1a3aa", // secondary text    6.5:1 on ink-700
    500: "#8f9299", // muted text        5.3:1 on ink-700
  },
  // The single accent. DEFAULT fills buttons and badges (white text 4.6:1);
  // hover goes darker, because lighter would drop below 4.5:1.
  accent: {
    DEFAULT: "#1f6feb",
    hover: "#1b5fcf",
  },
  signal: {
    // Status hues at matched brightness (about 6.5:1 on ink-700), so none
    // shouts louder than the others by accident.
    go: "#3fb950",
    watch: "#d29922",
    stop: "#f85149",
    "stop-text": "#ff7b72", // red for small text, a step lighter for margin
    route: "#58a6ff", // the accent as a line and text color: route, focus ring
  },
  // Fleet bar: white for the part that matters, grey for the rest.
  chart: {
    building: "#ededef",
    lot: "#6e7179",
  },
};
