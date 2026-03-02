"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginClient({ mode = "login" }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!email || !password) {
      setErr("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // În funcție de setările Supabase, poate cere confirmare email.
        setMsg("Account created. If email confirmation is enabled, check your inbox. Otherwise you can log in now.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (e) {
      setErr(e?.message || "Auth error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{isSignup ? "Create account" : "Login"}</h1>
          <p className="text-gray-400 mt-1">
            {isSignup ? "Create your account to access the dashboard." : "Login to access your dashboard."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-blue-500/50"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-blue-500/50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </div>

          {err ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
              {err}
            </div>
          ) : null}

          {msg ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-200 text-sm">
              {msg}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 font-semibold disabled:opacity-60"
          >
            {loading ? "Please wait..." : (isSignup ? "Create account" : "Login")}
          </button>

          <div className="text-sm text-gray-400 text-center pt-2">
            {isSignup ? (
              <a className="text-blue-400 hover:text-blue-300" href="/login?mode=login">
                Already have an account? Login
              </a>
            ) : (
              <a className="text-blue-400 hover:text-blue-300" href="/login?mode=signup">
                No account? Create one
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
