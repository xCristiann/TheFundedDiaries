"use client";

import { useState } from "react";
import LiveTicker from "@/components/market/LiveTicker";
import PriceChart from "@/components/market/PriceChart";

type SupportedSymbol = "US30" | "US500" | "XAUUSD" | "EURUSD";

export default function MarketPage() {
  const [symbol, setSymbol] = useState<SupportedSymbol>("US30");

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Market Demo</h1>
            <p className="text-white/60">Live quotes + chart via API-ul tău (/api/market/*)</p>
          </div>

          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value as SupportedSymbol)}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white outline-none"
          >
            <option value="US30">US30</option>
            <option value="US500">US500</option>
            <option value="XAUUSD">XAUUSD</option>
            <option value="EURUSD">EURUSD</option>
          </select>
        </div>

        <LiveTicker />
        <PriceChart symbol={symbol} resolution={1} />
      </div>
    </div>
  );
}
