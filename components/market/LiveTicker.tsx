"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SupportedSymbol = "US30" | "US500" | "XAUUSD" | "EURUSD";

type Quote =
  | { symbol: SupportedSymbol; price: number; time?: number; provider?: string; raw?: any }
  | { symbol: SupportedSymbol; error: string; status?: number; detail?: any };

const SYMBOLS: SupportedSymbol[] = ["US30", "US500", "XAUUSD", "EURUSD"];

function fmt(n: number) {
  if (!Number.isFinite(n)) return "-";
  return n >= 1000 ? n.toFixed(1) : n.toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
}

export default function LiveTicker() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    const tick = async () => {
      try {
        const results = await Promise.allSettled(
          SYMBOLS.map(async (s) => {
            const r = await fetch(`/api/market/quote?symbol=${encodeURIComponent(s)}`, { cache: "no-store" });
            const j = await r.json();
            return { s, j };
          })
        );

        if (!alive.current) return;

        const next: Record<string, Quote> = {};
        for (const res of results) {
          if (res.status === "fulfilled") {
            next[res.value.s] = res.value.j;
          }
        }
        setQuotes(next);
      } catch (e: any) {
        // silent
      }
    };

    tick();
    const id = setInterval(tick, 1000); // 1s update
    return () => {
      alive.current = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
      <div className="text-sm text-white/70 mb-2">Live Prices</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SYMBOLS.map((s) => {
          const q = quotes[s] as any;
          const price = q?.price;
          const ok = typeof price === "number" && Number.isFinite(price);

          return (
            <div key={s} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">{s}</div>
              <div className="text-xl font-semibold">{ok ? fmt(price) : "—"}</div>
              <div className="text-xs text-white/50 mt-1">
                {q?.provider ? `via ${q.provider}` : ""}
                {q?.error ? `Error: ${q.error}` : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[11px] text-white/40 mt-3">
        Note: US30/US500 sunt proxy pe planul free (ex: DIA/SPY) până avem feed CFD real.
      </div>
    </div>
  );
}
