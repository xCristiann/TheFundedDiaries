"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutClient() {
  const sp = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const challengeId = sp.get("challengeId") || sp.get("challenge_id") || sp.get("id");
  const couponCode = sp.get("coupon") || sp.get("couponCode") || null;

  const [status, setStatus] = useState("starting");
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr("");

        if (!challengeId) {
          setStatus("missing");
          return;
        }

        setStatus("auth");
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;

        const originUrl = window.location.origin;

        setStatus("creating");
        const r = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            challengeId,
            originUrl,
            userId: user?.id || null,
            email: user?.email || null,
            couponCode,
            discountAmount: 0
          }),
        });

        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(j?.error || "Failed to create checkout session");
        }

        const url = j?.url || j?.checkout_url || j?.checkoutUrl;
        if (!url) throw new Error("Checkout URL missing from API response");

        if (cancelled) return;
        setStatus("redirect");
        window.location.href = url;
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setErr(e?.message || "Checkout error");
      }
    })();

    return () => { cancelled = true; };
  }, [challengeId, couponCode, supabase]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>

        {status === "missing" ? (
          <p className="text-gray-400">
            Missing challenge id. Go back to Challenges and press Buy again.
          </p>
        ) : status === "error" ? (
          <>
            <p className="text-red-200">Error: {err}</p>
            <div className="mt-5 flex gap-3">
              <a className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-semibold" href="/challenges">
                Back to Challenges
              </a>
              <button
                className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 font-semibold"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-400">
            Preparing secure Stripe checkout… ({status})
          </p>
        )}
      </div>
    </div>
  );
}
