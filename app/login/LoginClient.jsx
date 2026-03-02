"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const mode = (sp.get("mode") || "login").toLowerCase();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // if already logged in -> dashboard
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.replace("/dashboard");
      }
    })();
  }, [supabase, router]);

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

        // Dacă ai confirmare email ON, utilizatorul trebuie să confirme.
        setMsg("Account created. If email confirmation is enabled, check your inbox. Otherwise you can log in now.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (e2) {
      setErr(e2?.message || "Auth error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{isSignup ? "Create account" : "Login"}</h1>
            <p className="text-gray-400 mt-1">
              {isSignup ? "Create your account to access the dashboard." : "Login to access your dashboard."}
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="/login?mode=login"
              className={`px-3 py-2 rounded-xl text-sm border border-white/10 ${!isSignup ? "bg-white/10 text-white" : "text-gray-300"}`}
            >
              Login
            </a>
            <a
              href="/login?mode=signup"
              className={`px-3 py-2 rounded-xl text-sm border border-white/10 ${isSignup ? "bg-white/10 text-white" : "text-gray-300"}`}
            >
              Sign up
            </a>
          </div>
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
        </form>
      </div>
    </div>
  );
}
