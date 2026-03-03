"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const challengeId = sp.get("challengeId") || sp.get("challenge_id") || sp.get("challenge") || "";
  const originUrl = sp.get("originUrl") || sp.get("origin_url") || (typeof window !== "undefined" ? window.location.origin : "");
  const email = sp.get("email") || "";
  const couponCode = sp.get("coupon") || sp.get("couponCode") || "";
  const discountAmount = sp.get("discount") ? Number(sp.get("discount")) : 0;

  const payload = useMemo(() => ({
    challengeId,
    originUrl,
    email: email || null,
    couponCode: couponCode || null,
    discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
  }), [challengeId, originUrl, email, couponCode, discountAmount]);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        if (!payload.challengeId) {
          setErr("Missing challenge id. Go back to Challenges and press Buy again.");
          setLoading(false);
          return;
        }
        if (!payload.originUrl) {
          setErr("Missing origin url. Please retry from Challenges.");
          setLoading(false);
          return;
        }

        const r = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const j = await r.json().catch(() => ({}));

        if (!r.ok) {
          setErr(j?.error || "Failed to create checkout session.");
          setLoading(false);
          return;
        }

        // Accept multiple shapes: {url} or {checkout_url}
        const url = j?.url || j?.checkout_url;
        if (!url) {
          setErr("Checkout session created but no redirect URL returned.");
          setLoading(false);
          return;
        }

        window.location.href = url;
      } catch (e) {
        console.error(e);
        setErr("Internal error starting checkout.");
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>

        {loading && !err && (
          <p className="text-gray-400">Redirecting to Stripe…</p>
        )}

        {err && (
          <>
            <p className="text-red-400">{err}</p>
            <div className="mt-6 flex gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
                onClick={() => router.push("/challenges")}
              >
                Back to Challenges
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </>
        )}

        <p className="text-xs text-gray-500 mt-6">
          Tip: Checkout must be opened from the “Buy” button so it includes the challenge id.
        </p>
      </div>
    </div>
  );
}

