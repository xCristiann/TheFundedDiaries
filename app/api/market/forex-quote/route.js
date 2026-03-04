import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAP = {
  EURUSD: "OANDA:EUR_USD",
  XAUUSD: "OANDA:XAU_USD",
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

    const url = `https://finnhub.io/api/v1/forex/rates?base=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`;
    const r = await fetch(url, { cache: "no-store" });

    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!r.ok) {
      return NextResponse.json({ error: "Finnhub error", status: r.status, detail: json }, { status: r.status });
    }

    return NextResponse.json({ symbol, data: json }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Server error", detail: String(e?.message || e) }, { status: 500 });
  }
}
