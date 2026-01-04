import { useState } from "react";
import { Link } from "react-router-dom";

import { ForgotPasswordSchema } from "@savemate/shared-validation";
import { typedApi } from "../api/typedClient";
import type { NormalizedError } from "../api/normalizedError";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      await typedApi.request("post", "/auth/forgot", { body: parsed.data });
      setOk(true);
    } catch (e2) {
      const err = e2 as NormalizedError;
      setError(err.error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Forgot password</h1>

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

        {ok && (
          <div className="text-sm text-slate-700">
            If an account exists, a reset email will be sent.
          </div>
        )}
        {error && <div className="text-sm text-red-700">{error}</div>}

        <button
          disabled={loading}
          className="w-full rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
          type="submit"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <div className="mt-4 text-sm">
        <Link to="/login" className="text-slate-700 underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
