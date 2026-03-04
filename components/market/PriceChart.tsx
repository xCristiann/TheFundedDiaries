"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, type ISeriesApi } from "lightweight-charts";

type Candle = { time: number; open: number; high: number; low: number; close: number };

export default function PriceChart({ data }: { data: Candle[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

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
      height: 380,
      rightPriceScale: { borderColor: "rgba(255,255,255,0.12)" },
      timeScale: { borderColor: "rgba(255,255,255,0.12)" },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#16a34a",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

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

  useEffect(() => {
    if (!seriesRef.current) return;
    // lightweight-charts v5 folosește time ca "UTCTimestamp" la secunde; noi trimitem number secunde => ok
    seriesRef.current.setData(
      (data || []).map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return <div ref={ref} className="w-full" />;
}
