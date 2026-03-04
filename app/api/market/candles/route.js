import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAP = {
  EURUSD: "OANDA:EUR_USD",
  XAUUSD: "OANDA:XAU_USD",
  US500:  "OANDA:SPX500_USD",
  US30:   "OANDA:US30_USD",
};

function getSymbol(sym) {
  const s = (sym || "").toUpperCase().trim();
  return MAP[s] || sym;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = getSymbol(searchParams.get("symbol"));
    const resolution = searchParams.get("resolution") || "1";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!symbol || !from || !to) {
      return NextResponse.json({ error: "Missing symbol/from/to" }, { status: 400 });
    }

    const key = process.env.FINNHUB_API_KEY;
    if (!key) return NextResponse.json({ error: "Missing FINNHUB_API_KEY" }, { status: 500 });

    const url =
      `https://finnhub.io/api/v1/forex/candle?symbol=${encodeURIComponent(symbol)}` +
      `&resolution=${encodeURIComponent(resolution)}&from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}&token=${encodeURIComponent(key)}`;

    const r = await fetch(url, { cache: "no-store" });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: "Finnhub error", details: t }, { status: r.status });
    }

    const raw = await r.json();

    // normalize for chart libs
    if (raw.s !== "ok") return NextResponse.json(raw, { status: 200 });

    const candles = raw.t.map((t, i) => ({
      time: t, // unix seconds
      open: raw.o[i],
      high: raw.h[i],
      low: raw.l[i],
      close: raw.c[i],
      volume: raw.v?.[i] ?? 0,
    }));

    return NextResponse.json({ symbol, resolution, candles }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Server error", details: String(e?.message || e) }, { status: 500 });
  }
}
