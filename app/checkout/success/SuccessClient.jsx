"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/components/glass-card";
import { Button } from "@/components/ui/button";

export default function SuccessClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get("session_id") || sp.get("sessionId") || "";

  const [status, setStatus] = useState("checking");
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        if (!sessionId) {
          if (alive) setStatus("missing");
          return;
        }
        const res = await fetch(`/api/stripe/status/${sessionId}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to verify payment");

        if (alive) {
          setDetails(json);
          setStatus(json?.payment_status || json?.status || "paid");
        }
      } catch (e) {
        console.error(e);
        if (alive) setStatus("error");
      }
    }

    check();
    return () => { alive = false; };
  }, [sessionId]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6">
      <GlassCard className="w-full max-w-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Payment Status</h1>

        {status === "checking" && <p className="text-gray-400">Verifying payment...</p>}
        {status === "missing" && (
          <p className="text-red-300">
            Missing session id. If you paid, open this page from Stripe redirect.
          </p>
        )}
        {status === "error" && (
          <p className="text-red-300">
            Could not verify payment right now. Try again in a moment.
          </p>
        )}

        {status !== "checking" && status !== "missing" && status !== "error" && (
          <div className="mt-4">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-200">
              Payment looks OK: <b>{String(status)}</b>
            </div>
          </div>
        )}

        {details && (
          <pre className="mt-6 text-xs text-gray-400 bg-black/20 p-4 rounded-xl overflow-auto">
{JSON.stringify(details, null, 2)}
          </pre>
        )}

        <div className="mt-8 flex gap-3">
          <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
            Go to Dashboard
          </Button>
          <Button onClick={() => router.push("/challenges")} className="bg-white/10 hover:bg-white/15">
            Back to Challenges
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
