"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const challengeId = useMemo(() => sp.get("challengeId") || sp.get("challenge_id") || "", [sp]);
  const couponCode = useMemo(() => sp.get("coupon") || "", [sp]);

  const [status, setStatus] = useState("init");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function startCheckout() {
      try {
        setStatus("creating");

        if (!challengeId) {
          setStatus("error");
          setError("Missing challengeId in URL. Example: /checkout?challengeId=UUID");
          return;
        }

        // originUrl trebuie să fie domeniul curent (Vercel)
        const originUrl = window.location.origin;

        const r = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId,
            originUrl,
            couponCode: couponCode || null
          }),
        });

        const j = await r.json().catch(() => ({}));

        if (!r.ok || !j?.url) {
          const msg = j?.error || j?.message || `Failed to create checkout session (${r.status})`;
          throw new Error(msg);
        }

        if (cancelled) return;

        setStatus("redirecting");
        window.location.href = j.url;
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e?.message || "Checkout failed");
      }
    }

    startCheckout();
    return () => { cancelled = true; };
  }, [challengeId, couponCode]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>

        {status !== "error" ? (
          <p className="text-gray-400">
            {status === "creating" && "Creating Stripe session..."}
            {status === "redirecting" && "Redirecting to Stripe..."}
            {status === "init" && "Starting..."}
          </p>
        ) : (
          <>
            <p className="text-red-400 font-semibold">Error processing order</p>
            <p className="text-gray-400 mt-2">{error}</p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/challenges")}
                className="px-4 py-2 rounded-xl bg-blue-500/80 hover:bg-blue-500 transition"
              >
                Back to Challenges
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-xs text-gray-500">
          challengeId: <span className="font-mono">{challengeId || "-"}</span>
        </div>
      </div>
    </div>
  );
}
