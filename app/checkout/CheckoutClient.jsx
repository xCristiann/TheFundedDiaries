"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/glass-card";

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-300">{label}</div>
      {children}
    </div>
  );
}

export default function CheckoutClient() {
  const supabase = createClient();
  const router = useRouter();
  const sp = useSearchParams();

  const challengeId = sp.get("challengeId") || sp.get("challenge") || "";
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [user, setUser] = useState(null);

  // platform: only TFD enabled, MT5 disabled
  const [platform, setPlatform] = useState("tfd-terminal");
  const [couponCode, setCouponCode] = useState("");

  // logged-in minimal
  const [street, setStreet] = useState("");
  const [postal, setPostal] = useState("");

  // guest fields
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const originUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const { data: u } = await supabase.auth.getUser();
        if (!mounted) return;

        setUser(u?.user ?? null);
        if (u?.user?.email) setGuestEmail(u.user.email);

        if (!challengeId) {
          setError("Missing challenge id. Go back to Challenges and press Get Started again.");
          setChallenge(null);
          return;
        }

        const { data, error: qerr } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

        if (qerr || !data) {
          setChallenge(null);
          setError("Challenge not found");
          return;
        }

        setChallenge(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [challengeId]);

  const onContinue = async () => {
    setError("");

    if (!challengeId) {
      setError("Missing challenge id.");
      return;
    }
    if (!challenge) {
      setError("Challenge not found");
      return;
    }

    if (user) {
      if (!street.trim() || !postal.trim()) {
        setError("Please fill Street and Postal code.");
        return;
      }
    } else {
      if (!guestEmail.trim() || !guestPassword.trim()) {
        setError("Please fill Email and Password.");
        return;
      }
      if (!firstName.trim() || !lastName.trim() || !country.trim() || !city.trim() || !postal.trim()) {
        setError("Please fill all required fields.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeId,
          originUrl,
          platform,
          couponCode: couponCode || null,

          userId: user?.id ?? null,
          email: guestEmail || null,

          street: street || null,
          postal: postal || null,
          city: city || null,
          country: country || null,
          firstName: firstName || null,
          lastName: lastName || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || `Checkout error (${res.status})`);
        return;
      }

      if (!json?.url) {
        setError("Stripe URL missing from server response.");
        return;
      }

      window.location.href = json.url;
    } catch (e) {
      setError("Internal error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const priceText = challenge?.price != null ? `$${Number(challenge.price).toFixed(2)}` : "-";
  const balText = challenge?.balance != null ? Number(challenge.balance).toLocaleString() : "-";
  const typeText = challenge?.type || "-";

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <GlassCard className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Checkout</h1>
              <p className="text-gray-400">Complete details, then you&apos;ll be redirected to Stripe.</p>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-400">Selected</div>
              <div className="text-lg font-semibold">
                {typeText} • {priceText}
              </div>
              <div className="text-xs text-gray-400">Balance: {balText}</div>
            </div>
          </div>

          {loading ? (
            <div className="min-h-[240px] flex items-center justify-center text-gray-300">Loading…</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left */}
              <div className="space-y-6">
                <Field label="Platform">
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setPlatform("tfd-terminal")}
                      className={`w-full text-left rounded-xl border p-4 transition ${
                        platform === "tfd-terminal"
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="font-semibold">TFD Terminal</div>
                      <div className="text-xs text-gray-400">Instant access after purchase.</div>
                    </button>

                    <div className="w-full text-left rounded-xl border border-white/10 p-4 bg-white/[0.02] opacity-60 cursor-not-allowed">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">MetaTrader 5</div>
                        <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/[0.03] text-gray-300">
                          Coming soon
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">Not available yet.</div>
                    </div>
                  </div>
                </Field>

                <Field label="Coupon Code (optional)">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="EX: TFD10"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                  />
                </Field>

                {error ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                    {error}
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button variant="secondary" onClick={() => router.push("/challenges")} disabled={busy}>
                    Back
                  </Button>
                  <Button
                    onClick={onContinue}
                    disabled={busy || !challenge}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 font-semibold px-6"
                  >
                    {busy ? "Redirecting…" : "Continue to Stripe"}
                  </Button>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Challenge ID: <span className="font-mono">{challengeId || "-"}</span>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-6">
                {user ? (
                  <>
                    <Field label="Email (for receipt)">
                      <input
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                      />
                      <div className="text-xs text-gray-500 mt-1">Stripe will send the receipt here.</div>
                    </Field>

                    <Field label="Street (required)">
                      <input
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Street address"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                      />
                    </Field>

                    <Field label="Postal code (required)">
                      <input
                        value={postal}
                        onChange={(e) => setPostal(e.target.value)}
                        placeholder="Postal code"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="font-semibold mb-1">Not logged in</div>
                      <div className="text-xs text-gray-400">
                        Fill the details below. You&apos;ll be redirected to Stripe to pay.
                      </div>
                    </div>

                    <Field label="Email (required)">
                      <input
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                      />
                    </Field>

                    <Field label="Password (required)">
                      <input
                        type="password"
                        value={guestPassword}
                        onChange={(e) => setGuestPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="First name (required)">
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                        />
                      </Field>
                      <Field label="Last name (required)">
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Country (required)">
                        <input
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                        />
                      </Field>
                      <Field label="City (required)">
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                        />
                      </Field>
                    </div>

                    <Field label="Postal code (required)">
                      <input
                        value={postal}
                        onChange={(e) => setPostal(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-500/40"
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
