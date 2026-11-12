import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import LotMap, { MapLegend } from "./Components/LotMap";
import JobPanel from "./Components/JobPanel";
import FleetCard from "./Components/FleetCard";
import RouteSteps from "./Components/RouteSteps";
import CorralDetail from "./Components/CorralDetail";
import LoginForm from "./Components/LoginForm";
import Sheet from "./Components/Sheet";
import Analytics from "./Components/Analytics";
import Disclaimer from "./Components/Disclaimer";
import { formatTime } from "./format";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// The iPad sits at the cart base all shift, so the lot refreshes itself
// instead of waiting for someone to reload the page.
const REFRESH_MS = 30_000;

// The current view lives in the URL hash (#/analytics), so a refresh keeps you
// where you were, the back button works, and a view can be linked to directly.
const VIEWS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "analytics", label: "Analytics" },
];
const viewFromHash = () => (window.location.hash === "#/analytics" ? "analytics" : "dashboard");
const subscribeToHash = (onChange) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

function App() {
  const view = useSyncExternalStore(subscribeToHash, viewFromHash);

  const [lot, setLot] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selected, setSelected] = useState(null); // corral whose sheet is open

  const [route, setRoute] = useState(null);
  const [routeStale, setRouteStale] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [depot, setDepot] = useState(null); // null = let the API choose the job

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // Every new copy of the lot comes through here, whether it came from the
  // refresh timer, a simulation, or a count update. If the counts moved since
  // the route was planned, the route gets flagged as out of date.
  const countsKey = useRef(null);
  const applyLot = useCallback((data) => {
    const key = JSON.stringify(data.counts);
    if (countsKey.current !== null && key !== countsKey.current) setRouteStale(true);
    countsKey.current = key;
    setLot(data);
    setLastUpdated(new Date());
    setLoadError(null);
  }, []);

  const loadLot = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/corrals`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      applyLot(await res.json());
    } catch (err) {
      // Data already on screen stays up and is marked stale instead of being
      // replaced by an error, so one network blip doesn't blank the iPad.
      setLoadError(`Could not reach the server at ${API_BASE}. ${err.message}`);
    }
  }, [applyLot]);

  // Refreshes on every view, so the live status in the header stays truthful
  // wherever you are.
  useEffect(() => {
    loadLot();
    const refresh = () => {
      if (!document.hidden) loadLot();
    };
    const timer = setInterval(refresh, REFRESH_MS);
    // Coming back to the tab (or waking the iPad) refreshes immediately.
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadLot]);

  // A stored token may have expired while the tab was closed, so it is checked
  // once on load rather than trusted until the first write fails.
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
    setLoginOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Each request gets a number and only the newest may write its result, so
  // tapping two bays in quick succession can't leave the older answer on screen.
  const planSeq = useRef(0);
  const planRoute = useCallback(async (bay) => {
    const seq = ++planSeq.current;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const qs = bay ? `?depot=${encodeURIComponent(bay)}` : "";
      const res = await fetch(`${API_BASE}/api/optimize-route${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server responded ${res.status}`);
      if (seq !== planSeq.current) return;
      setRoute({ ...data, plannedAt: new Date() });
      setRouteStale(false);
    } catch (err) {
      if (seq !== planSeq.current) return;
      setRoute(null);
      setRouteError(`Could not plan a route. ${err.message}`);
    } finally {
      if (seq === planSeq.current) setRouteLoading(false);
    }
  }, []);

  // Plan once as soon as the lot loads, so the screen already shows the next
  // job when a worker walks up. After that, plans happen on request, so the
  // route never changes under someone while they are reading it.
  const autoPlanned = useRef(false);
  useEffect(() => {
    if (lot && !autoPlanned.current) {
      autoPlanned.current = true;
      planRoute(null);
    }
  }, [lot, planRoute]);

  // Choosing a bay plans straight away: one tap instead of two.
  const chooseBay = (bay) => {
    setDepot(bay);
    planRoute(bay);
  };

  // Demo: randomise the whole lot, then immediately re-plan against it, so one
  // tap shows the counts, the map, and the routing decision all react together.
  const simulateLot = async () => {
    setSimulating(true);
    setRouteError(null);
    try {
      const res = await fetch(`${API_BASE}/api/simulate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server responded ${res.status}`);
      await loadLot();
      await planRoute(depot);
    } catch (err) {
      setRouteError(`Could not simulate. ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const stops = route?.optimizedRoute || [];
  const selectedCorral = lot?.corrals.find((c) => c.id === selected);
  const selectedIndex = selected ? stops.indexOf(selected) : -1;
  const selectedStop = selectedIndex > 0 && selectedIndex < stops.length - 1 ? selectedIndex : null;
  // Bays listed left to right, in the same order they sit on the map.
  const bays = lot ? lot.corrals.filter((c) => c.type === "supply").sort((a, b) => a.x - b.x) : [];
  const busy = routeLoading || simulating;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-ink-600 bg-ink-950">
        <div className="mx-auto flex h-14 max-w-7xl items-stretch gap-6 px-4 sm:px-6">
          <a href="#/dashboard" className="flex shrink-0 items-center gap-2 text-lg font-semibold">
            <Logo />
            CartDaddy
          </a>

          <nav aria-label="Views" className="flex items-stretch">
            {VIEWS.map((v) => (
              <a
                key={v.id}
                href={`#/${v.id}`}
                aria-current={view === v.id ? "page" : undefined}
                className="tab"
              >
                {v.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <LiveStatus lastUpdated={lastUpdated} error={loadError} />
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-haze-300">{user.username}</span>
                <button onClick={handleLogout} className="chip">
                  Log out
                </button>
              </>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="chip">
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {view === "analytics" && <Analytics apiBase={API_BASE} />}

        {view === "dashboard" && !lot && loadError && (
          <div className="panel panel-danger p-6" role="alert">
            <p className="text-2xl font-semibold text-signal-stop-text">Can't load the lot</p>
            <p className="text-base text-haze-300 mt-2">{loadError}</p>
            <button onClick={loadLot} className="btn mt-5">
              Retry
            </button>
          </div>
        )}

        {view === "dashboard" && !lot && !loadError && <DashboardSkeleton />}

        {view === "dashboard" && lot && (
          <>
            {loadError && (
              <div role="status" className="panel panel-warn p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-base">
                    <span className="font-semibold text-signal-watch">Not updating. </span>
                    <span className="text-haze-300">
                      The server isn't answering, so these counts are from {formatTime(lastUpdated)}.
                      Retrying every {REFRESH_MS / 1000} seconds.
                    </span>
                  </p>
                  <button onClick={loadLot} className="chip">
                    Retry now
                  </button>
                </div>
              </div>
            )}

            {/* Landscape: next job and the fleet side by side, then the map at
                full width so it is as large as possible, then the walking
                order. Portrait: the same blocks stacked in that order. */}
            <div className="grid gap-4 lg:grid-cols-12">
              <JobPanel
                className="lg:col-span-8"
                route={route}
                loading={routeLoading}
                error={routeError}
                stale={routeStale}
                depot={depot}
                bays={bays}
                busy={busy}
                simulating={simulating}
                onChooseBay={chooseBay}
                onPlan={() => planRoute(depot)}
                onSimulate={simulateLot}
              />

              <FleetCard className="lg:col-span-4" building={lot.building} corralCount={lot.corrals.length} />

              <section className="panel p-4 sm:p-5 lg:col-span-12" aria-labelledby="map-title">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-4">
                  <div>
                    <h2 id="map-title" className="text-lg font-semibold">
                      Lot
                    </h2>
                    <p className="text-sm text-haze-300">Tap a corral to see it or update its count.</p>
                  </div>
                  <MapLegend routeActive={stops.length > 1} />
                </div>
                <LotMap counts={lot.counts} route={stops} selected={selected} onSelect={setSelected} />
              </section>

              <RouteSteps className="lg:col-span-12" route={route} lot={lot} onOpen={setSelected} />
            </div>
          </>
        )}

        <Disclaimer />
      </main>

      <Sheet
        open={Boolean(selectedCorral)}
        onClose={() => setSelected(null)}
        label={selectedCorral ? `Corral ${selectedCorral.id}` : "Corral"}
      >
        {selectedCorral && (
          <CorralDetail
            apiBase={API_BASE}
            corral={selectedCorral}
            count={lot.counts[selectedCorral.id] ?? 0}
            routeStop={selectedStop}
            routeStops={Math.max(0, stops.length - 2)}
            token={token}
            onUpdate={applyLot}
            onAuthExpired={handleLogout}
            onLogin={handleLogin}
            onClose={() => setSelected(null)}
          />
        )}
      </Sheet>

      <Sheet variant="center" open={loginOpen} onClose={() => setLoginOpen(false)} label="Log in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-2xl font-semibold">Log in</h2>
          <button onClick={() => setLoginOpen(false)} className="chip -mr-1 px-3" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <LoginForm apiBase={API_BASE} onLogin={handleLogin} />
      </Sheet>
    </div>
  );
}

// The favicon's cart.
function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h3.5l3.2 13h13L26 9H8" />
        <circle cx="12" cy="25.5" r="2" />
        <circle cx="22" cy="25.5" r="2" />
      </g>
    </svg>
  );
}

// Says when the numbers were last fetched. If the server stops answering, the
// dot turns amber and the text says the numbers have stopped updating.
function LiveStatus({ lastUpdated, error }) {
  let state = { dot: "bg-signal-go", text: `Updated ${formatTime(lastUpdated)}` };
  if (!lastUpdated) {
    state = error
      ? { dot: "bg-signal-stop", text: "Offline" }
      : { dot: "bg-haze-500", text: "Connecting…" };
  } else if (error) {
    state = { dot: "bg-signal-watch", text: `Not updating since ${formatTime(lastUpdated)}` };
  }

  return (
    <p className="hidden items-center gap-2 text-sm text-haze-300 sm:flex">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${state.dot}`} />
      {state.text}
    </p>
  );
}

// Same shapes as the real dashboard, so nothing jumps when the data arrives.
function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12" aria-busy="true">
      <span className="sr-only">Loading lot data…</span>
      <div className="panel p-6 lg:col-span-8">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-12 w-3/4 mt-4" />
        <div className="skeleton h-5 w-1/2 mt-3" />
        <div className="skeleton h-11 w-full mt-8" />
      </div>
      <div className="panel p-6 lg:col-span-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-2 w-full mt-5" />
        <div className="skeleton h-24 w-full mt-5" />
      </div>
      <div className="panel p-5 lg:col-span-12">
        <div className="skeleton h-3 w-24 mb-4" />
        <div className="skeleton w-full aspect-[940/336]" />
      </div>
    </div>
  );
}

export default App;
