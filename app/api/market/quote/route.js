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

    if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

    const key = process.env.FINNHUB_API_KEY;
    if (!key) return NextResponse.json({ error: "Missing FINNHUB_API_KEY" }, { status: 500 });

    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`;
    const r = await fetch(url, { cache: "no-store" });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: "Finnhub error", details: t }, { status: r.status });
    }

    const data = await r.json();
    return NextResponse.json({ symbol, ...data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Server error", details: String(e?.message || e) }, { status: 500 });
  }
}
