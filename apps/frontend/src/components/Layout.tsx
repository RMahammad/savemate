import { Link, Outlet } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold">
            SaveMate
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <span className="text-slate-600">{user.role}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded border border-slate-300 px-3 py-1"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-700">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded border border-slate-300 px-3 py-1"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
