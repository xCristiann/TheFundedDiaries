"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutSuccessClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        if (!sessionId) {
          setStatus("missing");
          return;
        }
        // optional: call your status endpoint if it exists
        const r = await fetch(`/api/stripe/status/${sessionId}`);
        if (!r.ok) {
          setStatus("ok");
          return;
        }
        const j = await r.json().catch(() => ({}));
        if (!ignore) setStatus(j?.status || "ok");
      } catch {
        if (!ignore) setStatus("ok");
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Payment successful</h1>

        {status === "missing" ? (
          <p className="text-gray-400">Missing session id. If you paid, check your dashboard accounts.</p>
        ) : (
          <p className="text-gray-400">Your order is being processed. You can go to your dashboard now.</p>
        )}

        <div className="mt-6 flex gap-3">
          <a
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 font-semibold"
          >
            Go to Dashboard
          </a>
          <a
            href="/challenges"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-semibold text-gray-200"
          >
            Back to Challenges
          </a>
        </div>
      </div>
    </div>
  );
}
