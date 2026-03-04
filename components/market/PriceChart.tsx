"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi, type CandlestickData } from "lightweight-charts";

type SupportedSymbol = "EURUSD" | "XAUUSD" | "US30" | "US500";

type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

export default function PriceChart({ symbol, resolution = 1 }: { symbol: SupportedSymbol; resolution?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [data, setData] = useState<Candle[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // create chart once
  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.75)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      width: ref.current.clientWidth,
      height: 420,
      rightPriceScale: { borderColor: "rgba(255,255,255,0.12)" },
      timeScale: { borderColor: "rgba(255,255,255,0.12)" },
    });

    // v4 API:
    const series = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series as any;

    const onResize = () => {
      if (!ref.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: ref.current.clientWidth });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // fetch candles whenever symbol/res changes
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setErr(null);

        const to = Math.floor(Date.now() / 1000);
        // last 2 hours for 1m, else last 3 days for higher res
        const from = resolution <= 1 ? to - 2 * 60 * 60 : to - 3 * 24 * 60 * 60;

        const url = `/api/market/candles?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`;
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json();

        if (!r.ok) throw new Error(j?.error || "Candles fetch failed");

        const rows: Candle[] = j?.candles || j?.data || [];
        if (!cancelled) setData(rows);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error");
      }
    }

    run();
    const t = setInterval(run, 15_000); // refresh candles
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [symbol, resolution]);

  // push data into chart
  useEffect(() => {
    if (!seriesRef.current) return;

    const mapped: CandlestickData[] = (data || []).map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(mapped as any);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div className="w-full">
      {err ? (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}
      <div ref={ref} className="w-full" />
    </div>
  );
}
