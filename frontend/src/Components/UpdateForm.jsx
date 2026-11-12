import { useState } from "react";

// Count editor inside the corral sheet. On an iPad, nudging a number with big
// -/+ buttons is faster and less error-prone than typing, and the field is
// still there for jumping straight to a value.
const STEPS = [-5, -1, 1, 5];

function UpdateForm({ apiBase = "", token, corral, count, onUpdate, onAuthExpired }) {
  const [draft, setDraft] = useState(String(count));
  const [dirty, setDirty] = useState(false);
  const [prevCount, setPrevCount] = useState(count);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If the lot refreshes while the sheet is open, follow the new count, unless
  // the worker has already started editing it. Comparing with the previous
  // prop during render is React's recommended way to react to a prop change.
  if (count !== prevCount) {
    setPrevCount(count);
    if (!dirty) setDraft(String(count));
  }

  const capacity = corral.type === "supply" ? corral.capacity : null;
  const parsed = Number(draft);
  const valid = draft !== "" && Number.isInteger(parsed) && parsed >= 0;
  const overCapacity = valid && capacity != null && parsed > capacity;
  const clamp = (n) => Math.max(0, capacity != null ? Math.min(capacity, n) : n);

  const edit = (value) => {
    setDraft(value);
    setDirty(true);
    setError("");
    setSuccess("");
  };

  const save = async (newCount) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/corrals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ corral_id: corral.id, count: newCount }),
      });
      const data = await res.json().catch(() => ({}));

      // An expired shift token should send the worker back to the login form
      // rather than showing a generic failure they cannot act on.
      if (res.status === 401) {
        onAuthExpired?.();
        throw new Error(data.error || "Session expired");
      }
      if (!res.ok) throw new Error(data.error || `Server responded ${res.status}`);

      onUpdate(data);
      setDraft(String(newCount));
      setDirty(false);
      setSuccess(`Saved. ${corral.id} now has ${newCount} ${newCount === 1 ? "cart" : "carts"}.`);
    } catch (err) {
      setError(`Could not save. ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return setError("Enter a whole number, 0 or more.");
    if (overCapacity) return setError(`${corral.label || corral.id} holds at most ${capacity} carts.`);
    save(parsed);
  };

  const describedBy = [error ? "count-error" : null, "count-hint"].filter(Boolean).join(" ");

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <label htmlFor="count-input" className="block text-base font-semibold">
        Update count
      </label>

      <div className="grid grid-cols-[repeat(2,3.25rem)_1fr_repeat(2,3.25rem)] gap-1.5">
        {STEPS.slice(0, 2).map((step) => (
          <StepButton key={step} step={step} disabled={submitting} onClick={() => edit(String(clamp((valid ? parsed : count) + step)))} />
        ))}
        <input
          id="count-input"
          type="number"
          // Number pad on the iPad instead of the full keyboard.
          inputMode="numeric"
          pattern="[0-9]*"
          min="0"
          max={capacity ?? undefined}
          value={draft}
          onChange={(e) => edit(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="field h-14 text-center text-3xl font-semibold px-1"
        />
        {STEPS.slice(2).map((step) => (
          <StepButton key={step} step={step} disabled={submitting} onClick={() => edit(String(clamp((valid ? parsed : count) + step)))} />
        ))}
      </div>
      <p id="count-hint" className="text-xs text-haze-500">
        {capacity != null ? `Holds up to ${capacity}. ` : ""}Last saved: {count}.
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={submitting || !dirty} className="btn flex-1">
          {submitting ? "Saving…" : "Save count"}
        </button>
        {/* Clearing a lot corral is the most common update a worker makes,
            so it gets a one-tap shortcut. */}
        {corral.type === "return" && count > 0 && (
          <button type="button" disabled={submitting} onClick={() => save(0)} className="chip flex-1">
            Mark cleared
          </button>
        )}
      </div>

      {error && (
        <p id="count-error" role="alert" className="text-sm text-signal-stop-text">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-signal-go">
          {success}
        </p>
      )}
    </form>
  );
}

function StepButton({ step, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${step > 0 ? "Add" : "Remove"} ${Math.abs(step)}`}
      className="chip h-14 px-0 text-lg font-semibold"
    >
      {step > 0 ? `+${step}` : `−${Math.abs(step)}`}
    </button>
  );
}

export default UpdateForm;
