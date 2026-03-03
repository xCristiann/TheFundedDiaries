"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CheckoutClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  // accept both: ?challengeId= and legacy ?challenge=
  const challengeId = sp.get("challengeId") || sp.get("challenge") || "";

  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [err, setErr] = useState("");

  const [challenge, setChallenge] = useState(null);

  // UI fields (keep it simple & functional)
  const [platform, setPlatform] = useState("tfd-trade");
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        setErr("");
        if (!challengeId) {
          setBootLoading(false);
          return;
        }

        // get user email (optional)
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user?.email && alive) setEmail(auth.user.email);

        // load challenge details
        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

        if (error) throw error;
        if (alive) setChallenge(data);
      } catch (e) {
        console.error(e);
        if (alive) setErr(e?.message || "Failed to load challenge");
      } finally {
        if (alive) setBootLoading(false);
      }
    }

    boot();
    return () => { alive = false; };
  }, [challengeId, supabase]);

  async function startCheckout() {
    try {
      setLoading(true);
      setErr("");

      if (!challengeId) {
        setErr("Missing challenge id. Go back to Challenges and press Get Started again.");
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id || null;

      const originUrl = window.location.origin;

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeId,
          originUrl,
          userId,
          email: email || null,
          couponCode: couponCode || null,
          discountAmount: 0,
          platform: platform || "tfd-trade"
        })
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to create checkout session");
      }

      const url = json?.url || json?.checkoutUrl || json?.sessionUrl;
      if (!url) throw new Error("Stripe session created but missing redirect URL");
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Checkout error");
    } finally {
      setLoading(false);
    }
  }

  if (bootLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        Loading checkout...
      </div>
    );
  }

  if (!challengeId) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-6">
        <GlassCard className="w-full max-w-2xl p-8">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-red-300 mb-6">
            Missing challenge id. Go back to Challenges and press <b>Get Started</b> again.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/challenges")} className="bg-white/10 hover:bg-white/15">
              Back to Challenges
            </Button>
            <Button onClick={() => router.refresh()} className="bg-blue-600 hover:bg-blue-700">
              Retry
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6">
      <GlassCard className="w-full max-w-3xl p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-1">Checkout</h1>
            <p className="text-gray-400">
              Complete details, then you’ll be redirected to Stripe.
            </p>
          </div>
          {challenge && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Selected</div>
              <div className="font-semibold">
                {challenge.type} • ${Number(challenge.price || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                Balance: {Number(challenge.balance || 0).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tfd-trade">TFD Trade (Web)</SelectItem>
                <SelectItem value="mt5">MetaTrader 5</SelectItem>
                <SelectItem value="cTrader">cTrader</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">You can change this later from your account.</p>
          </div>

          <div className="space-y-2">
            <Label>Email (for receipt)</Label>
            <Input
              className="bg-white/5 border-white/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
            <p className="text-xs text-gray-500">Stripe will send the receipt here.</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Coupon Code (optional)</Label>
            <Input
              className="bg-white/5 border-white/10"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="EX: TFD10"
            />
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
            {err}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button onClick={() => router.push("/challenges")} className="bg-white/10 hover:bg-white/15">
            Back
          </Button>
          <Button
            onClick={startCheckout}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8"
          >
            {loading ? "Redirecting..." : "Continue to Stripe"}
          </Button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Challenge ID: <span className="font-mono">{challengeId}</span>
        </div>
      </GlassCard>
    </div>
  );
}
