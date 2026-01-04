import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { LoginSchema } from "@savemate/shared-validation";
import { typedApi } from "../api/typedClient";
import type { NormalizedError } from "../api/normalizedError";
import { useAuth } from "../auth/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Please enter a valid email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await typedApi.request("post", "/auth/login", {
        body: parsed.data,
      });
      setAccessToken(res.accessToken);
      navigate("/", { replace: true });
    } catch (e2) {
      const err = e2 as NormalizedError;
      setError(err.error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Login</h1>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block">
          <div className="text-sm text-slate-700">Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="email"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <div className="text-sm text-slate-700">Password</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="password"
            autoComplete="current-password"
          />
        </label>

        {error && <div className="text-sm text-red-700">{error}</div>}

        <button
          disabled={loading}
          className="w-full rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
          type="submit"
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/forgot" className="text-slate-700 underline">
          Forgot password?
        </Link>
        <Link to="/register" className="text-slate-700 underline">
          Register
        </Link>
      </div>
    </div>
  );
}
