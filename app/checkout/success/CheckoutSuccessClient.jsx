"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccessClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");

  const [status, setStatus] = useState("Checking payment...");

  useEffect(() => {
    // Dacă ai deja endpoint-ul tău de status, îl păstrăm:
    // /api/stripe/status?session_id=...
    // Dacă ai alt route, îl schimbi aici.
    if (!sessionId) {
      setStatus("Missing session_id.");
      return;
    }

    (async () => {
      try {
        const r = await fetch(`/api/stripe/status?session_id=${encodeURIComponent(sessionId)}`);
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setStatus(j?.error || "Failed to verify payment.");
          return;
        }
        setStatus(j?.status ? `Payment status: ${j.status}` : "Payment verified.");
      } catch {
        setStatus("Network error while verifying payment.");
      }
    })();
  }, [sessionId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Payment Success</h1>
        <p className="text-gray-400 mb-6">{status}</p>

        <div className="flex gap-3">
          <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            Go to Dashboard
          </Link>
          <Link href="/challenges" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white">
            Back to Challenges
          </Link>
        </div>
      </div>
    </div>
  );
}
