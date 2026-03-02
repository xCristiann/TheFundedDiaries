"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = useMemo(() => sp.get("session_id") || sp.get("sessionId") || "", [sp]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        if (!sessionId) {
          setError("Missing session_id in URL.");
          setLoading(false);
          return;
        }

        // dacă ai endpoint: /api/stripe/status/[sessionId]
        const r = await fetch(`/api/stripe/status/${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));

        if (!r.ok) {
          throw new Error(j?.error || `Status check failed (${r.status})`);
        }

        if (cancelled) return;
        setData(j);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Failed to verify session");
        setLoading(false);
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Payment success</h1>

        {loading ? (
          <p className="text-gray-400">Verifying payment...</p>
        ) : error ? (
          <>
            <p className="text-red-400 font-semibold">Could not verify</p>
            <p className="text-gray-400 mt-2">{error}</p>
          </>
        ) : (
          <>
            <p className="text-green-400 font-semibold">Verified ✅</p>
            <p className="text-gray-400 mt-2">
              If your account provisioning is automatic, it should appear in Dashboard shortly.
            </p>
            <pre className="mt-4 text-xs text-gray-300 bg-black/20 rounded-xl p-4 overflow-auto">
{JSON.stringify(data, null, 2)}
            </pre>
          </>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl bg-blue-500/80 hover:bg-blue-500 transition"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push("/challenges")}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
          >
            Back to Challenges
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          session_id: <span className="font-mono">{sessionId || "-"}</span>
        </div>
      </div>
    </div>
  );
}
