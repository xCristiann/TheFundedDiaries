"use client";

export default function ChartCard({ symbol }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Chart</div>
        <div className="text-sm text-gray-400">{symbol}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 h-[320px] flex items-center justify-center text-gray-500">
        Chart placeholder (TradingView next)
      </div>

      <div className="mt-3 flex gap-2">
        {["1m","5m","15m","1h","4h","1D"].map((tf) => (
          <span key={tf} className="text-xs rounded-lg border border-white/10 px-2 py-1 text-gray-400">
            {tf}
          </span>
        ))}
      </div>
    </div>
  );
}
