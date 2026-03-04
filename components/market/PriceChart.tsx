"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";

type SupportedSymbol = "US30" | "US500" | "XAUUSD" | "EURUSD";

type Candle = { time: number; open: number; high: number; low: number; close: number };

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function toLW(c: Candle) {
  return {
    time: c.time as UTCTimestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  };
}

export default function PriceChart({
  symbol,
  resolution = 1,
}: {
  symbol: SupportedSymbol;
  resolution?: number; // minute
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, {
      autoSize: true,
      layout: { background: { color: "transparent" }, textColor: "rgba(255,255,255,0.75)" },
      grid: { vertLines: { color: "rgba(255,255,255,0.06)" }, horzLines: { color: "rgba(255,255,255,0.06)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.12)" },
      timeScale: { borderColor: "rgba(255,255,255,0.12)" },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => chart.timeScale().fitContent());
    ro.observe(ref.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let stop = false;

    const load = async () => {
      setErr(null);
      try {
        const to = nowSec();
        const from = to - 60 * 120; // last 2h
        const url = `/api/market/candles?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`;
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json();

        if (stop) return;
        if (!r.ok || j?.error) {
          setErr(j?.error || `Candles failed (${r.status})`);
          return;
        }

        const candles: Candle[] = j?.candles || j?.t || [];
        // suportam si formatul cu arrays daca exista
        const normalized: Candle[] = Array.isArray(candles)
          ? candles
          : [];

        const lw = normalized.map(toLW);
        seriesRef.current?.setData(lw);
        chartRef.current?.timeScale().fitContent();
      } catch (e: any) {
        if (!stop) setErr("Candles fetch failed");
      }
    };

    load();
    const id = setInterval(load, 10_000); // refresh candles la 10s

    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [symbol, resolution]);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-white/70">Chart</div>
          <div className="text-lg font-semibold">{symbol} • {resolution}m</div>
        </div>
        {err ? <div className="text-sm text-red-400">{err}</div> : null}
      </div>

      <div ref={ref} className="h-[420px] w-full" />
    </div>
  );
}
