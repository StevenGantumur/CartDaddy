import { useState } from "react";

function LoginForm({ apiBase, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server responded ${res.status}`);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Visible labels rather than placeholders: a placeholder disappears as soon as
  // you start typing, which leaves an unlabeled box.
  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm" noValidate>
      <p className="text-sm text-haze-300">Log in to update cart counts.</p>
      <div>
        <label htmlFor="login-username" className="field-label">
          Username
        </label>
        <input
          id="login-username"
          type="text"
          autoComplete="username"
          // iPad keyboards capitalize the first letter by default, which
          // silently turns "steven" into "Steven" and fails the login.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "login-error" : undefined}
          className="field w-full"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="field-label">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "login-error" : undefined}
          className="field w-full"
        />
      </div>
      {error && (
        <p id="login-error" role="alert" className="text-sm text-signal-stop-text">
          {error}
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn w-full">
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

export default LoginForm;
