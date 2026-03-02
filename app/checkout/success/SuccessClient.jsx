"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuccessClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");

  const [msg, setMsg] = useState("Finalizing your order…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!sessionId) {
          setMsg("Payment successful. If your account is not visible yet, refresh Dashboard in 10 seconds.");
          return;
        }

        // optional status endpoint (you already have it)
        const r = await fetch(`/api/stripe/status/${sessionId}`, { cache: "no-store" });
        if (!r.ok) {
          setMsg("Payment successful. Your challenge will appear in Dashboard shortly.");
          return;
        }
        const j = await r.json().catch(() => ({}));
        if (cancelled) return;
        setMsg(j?.status ? `Payment status: ${j.status}` : "Payment successful. Your challenge will appear in Dashboard shortly.");
      } catch {
        if (!cancelled) setMsg("Payment successful. Your challenge will appear in Dashboard shortly.");
      }
    })();

    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Payment successful</h1>
        <p className="text-gray-400">{msg}</p>

        <div className="mt-6 flex gap-3">
          <a href="/dashboard" className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 font-semibold">
            Go to Dashboard
          </a>
          <a href="/challenges" className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-semibold text-gray-200">
            Back to Challenges
          </a>
        </div>
      </div>
    </div>
  );
}
