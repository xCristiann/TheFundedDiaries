"use client";
import { useMemo, useState } from "react";

const DEFAULT = [
  { symbol: "US30", name: "Dow Jones", hint: "Index" },
  { symbol: "XAUUSD", name: "Gold", hint: "Metal" },
  { symbol: "EURUSD", name: "EUR/USD", hint: "FX" },
];

export default function Watchlist({ value, onChange }) {
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DEFAULT;
    return DEFAULT.filter((x) => (x.symbol + " " + x.name).toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Watchlist</div>
        <span className="text-xs text-gray-500">demo</span>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/20"
      />

      <div className="mt-3 space-y-2">
        {items.map((it) => {
          const active = it.symbol === value;
          return (
            <button
              key={it.symbol}
              onClick={() => onChange?.(it.symbol)}
              className={[
                "w-full text-left rounded-xl border px-3 py-3 transition",
                active
                  ? "border-[#8b7306]/60 bg-[#8b7306]/10"
                  : "border-white/10 hover:bg-white/5"
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{it.symbol}</div>
                <div className="text-xs text-gray-500">{it.hint}</div>
              </div>
              <div className="text-sm text-gray-400">{it.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
