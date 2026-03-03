"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

function money(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function CheckoutClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  // acceptăm toate variantele: challengeId / challenge_id / challenge
  const challengeId =
    sp.get("challengeId") || sp.get("challenge_id") || sp.get("challenge") || "";

  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");

  // form
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState("tfd-trade");
  const [couponCode, setCouponCode] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);

      if (!challengeId) {
        setLoading(false);
        return;
      }

      // prefill email dacă e logat
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user?.email) setEmail(auth.user.email);
      } catch {}

      const { data, error: e } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

      if (e || !data) {
        setError("Nu am găsit challenge-ul. Înapoi la Challenges și apasă Buy din nou.");
        setChallenge(null);
      } else {
        setChallenge(data);
      }

      setLoading(false);
    })();
  }, [challengeId, supabase]);

  const goBack = () => router.push("/challenges");

  const startCheckout = async () => {
    setError("");

    if (!challengeId) {
      setError("Missing challenge id. Înapoi la Challenges și apasă Buy din nou.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Introdu un email valid.");
      return;
    }

    setPaying(true);
    try {
      // userId (dacă există)
      let userId = null;
      const { data: auth } = await supabase.auth.getUser();
      userId = auth?.user?.id ?? null;

      const originUrl = window.location.origin;

      const r = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          originUrl,
          userId,
          email,
          couponCode: couponCode || null,
          // platforma o trimitem ca metadata/logic server (dacă vrei să o salvezi în DB pe webhook)
          platform,
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.url) {
        setError(j?.error || "Failed to create checkout session.");
        setPaying(false);
        return;
      }

      window.location.href = j.url;
    } catch (e) {
      setError("Internal error. Încearcă din nou.");
      setPaying(false);
    }
  };

  if (!challengeId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <GlassCard className="w-full max-w-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-red-300/90">
            Missing challenge id. Go back to Challenges and press Buy again.
          </p>

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={goBack}>Back to Challenges</Button>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Tip: Checkout must be opened from the “Buy” button so it includes the challenge id.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-gray-300">Loading checkout…</div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <GlassCard className="w-full max-w-3xl p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-gray-400 mt-1">
              Completează detaliile, apoi vei fi redirecționat către Stripe.
            </p>
          </div>

          <Button variant="secondary" onClick={goBack}>
            Back to Challenges
          </Button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {challenge && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-semibold">
                {String(challenge.type || "challenge").toUpperCase()} • ${money(challenge.balance)}
              </div>
              <div className="text-sm text-gray-400">
                Price: <span className="text-gray-200 font-semibold">${money(challenge.price)}</span>
              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-gray-400">Profit Target</div>
                <div className="font-semibold">{challenge.profit_target}%</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-gray-400">Daily DD</div>
                <div className="font-semibold">{challenge.daily_drawdown}%</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-gray-400">Max DD</div>
                <div className="font-semibold">{challenge.max_drawdown}%</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <Label>Email</Label>
            <Input
              className="mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
            <p className="mt-2 text-xs text-gray-400">
              Email-ul va fi folosit pentru confirmare și acces.
            </p>
          </div>

          <div>
            <Label>Platform</Label>
            <div className="mt-2">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tfd-trade">TFD Trade (web)</SelectItem>
                  <SelectItem value="mt5">MT5</SelectItem>
                  <SelectItem value="ctrader">cTrader</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Platforma o folosim pentru a seta contul după plată.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label>Coupon code (optional)</Label>
            <Input
              className="mt-2"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="EX: TFD10"
            />
          </div>
        </div>

        <div className="mt-7 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="text-xs text-gray-400">
            Vei fi redirecționat către Stripe (Live).
          </div>

          <Button
            onClick={startCheckout}
            disabled={paying}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            {paying ? "Redirecting…" : "Continue to Stripe"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
