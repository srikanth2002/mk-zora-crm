"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const OWNER_EMAIL = "owner@mkzora.com";
const OWNER_PASSWORD = "MKZora@123";

export default function OwnerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    if (
      email.trim().toLowerCase() === OWNER_EMAIL &&
      password === OWNER_PASSWORD
    ) {
      localStorage.setItem(
        "mkzora_owner_session",
        JSON.stringify({
          id: "OWNER001",
          name: "MK ZORA Owner",
          email: OWNER_EMAIL,
          role: "Owner",
        })
      );

      router.push("/");
      return;
    }

    setLoading(false);
    setError("Invalid owner email or password.");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-[440px]">

          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src="/logo.png"
                alt="MK ZORA"
                className="h-16 w-16 object-contain"
              />
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              ZORA TRACK
            </h1>

            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              MK ZORA Work Management
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">

            <div className="mb-7">
              <h2 className="text-xl font-bold text-slate-900">
                Owner Login
              </h2>

              <p className="mt-1.5 text-sm text-slate-500">
                Sign in to manage your team and work.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Owner Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter owner email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter owner password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in as Owner"}
              </button>
            </form>

            {/* Employee Login */}
            <div className="mt-6 border-t border-slate-100 pt-6 text-center">
              <p className="text-xs text-slate-400">
                Are you an employee?
              </p>

              <button
                type="button"
                onClick={() => router.push("/employee")}
                className="mt-1 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900"
              >
                Go to Employee Login
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-400">
            ZORA TRACK · Work. People. Progress.
          </p>
        </div>
      </div>
    </main>
  );
}