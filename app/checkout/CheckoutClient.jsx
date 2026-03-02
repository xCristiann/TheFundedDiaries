"use client";

import { useSearchParams } from "next/navigation";

export default function CheckoutClient() {
  const sp = useSearchParams();
  const challengeId = sp.get("challengeId") || sp.get("challenge_id") || "";
  const coupon = sp.get("coupon") || "";
  const mode = sp.get("mode") || "";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-gray-400">Client-only page (no prerender crash).</p>

        <div className="mt-4 text-sm text-gray-300 space-y-1">
          <div>challengeId: <span className="font-mono">{challengeId || "-"}</span></div>
          <div>coupon: <span className="font-mono">{coupon || "-"}</span></div>
          <div>mode: <span className="font-mono">{mode || "-"}</span></div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Replace this UI with your real checkout flow (Stripe redirect etc).
        </div>
      </div>
    </div>
  );
}
