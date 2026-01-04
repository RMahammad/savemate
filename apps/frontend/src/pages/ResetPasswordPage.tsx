import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ResetPasswordSchema } from "@savemate/shared-validation";
import { resetPassword } from "../api/auth";
import type { NormalizedError } from "../api/normalizedError";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get("token") ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const parsed = ResetPasswordSchema.safeParse({ token, newPassword });
    if (!parsed.success) {
      setError("Please provide a valid token and new password.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(parsed.data);
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
      <h1 className="text-xl font-semibold">Reset password</h1>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block">
          <div className="text-sm text-slate-700">Token</div>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="text"
          />
        </label>

        <label className="block">
          <div className="text-sm text-slate-700">New password</div>
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="password"
            autoComplete="new-password"
          />
        </label>

        {ok && <div className="text-sm text-slate-700">Password updated.</div>}
        {error && <div className="text-sm text-red-700">{error}</div>}

        <button
          disabled={loading}
          className="w-full rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
          type="submit"
        >
          {loading ? "Updating…" : "Reset password"}
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
