import { NextResponse } from "next/server";
import { mapToFinnhub } from "../../../../lib/market/symbols";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = (searchParams.get("symbol") || "").trim().toUpperCase();
    const resolution = (searchParams.get("resolution") || "1").trim(); // 1, 5, 15, 30, 60, D, W, M
    const from = Number(searchParams.get("from"));
    const to = Number(searchParams.get("to"));

    if (!symbol || !resolution || !from || !to) {
      return NextResponse.json(
        { error: "Missing params. Use: symbol, resolution, from, to (unix seconds)" },
        { status: 400 }
      );
    }

    const mapped = mapToFinnhub(symbol);
    if (!mapped) {
      return NextResponse.json(
        { error: "Unsupported symbol", supported: ["EURUSD","XAUUSD","US30","US500"] },
        { status: 400 }
      );
    }

    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      return NextResponse.json(
        { error: "Missing FINNHUB_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    // Stocks/ETFs candles endpoint:
    //   /stock/candle?symbol=...&resolution=...&from=...&to=...
    // Forex candles endpoint is /forex/candle (may require paid plan).
    const base =
      mapped.kind === "stock"
        ? "https://finnhub.io/api/v1/stock/candle"
        : "https://finnhub.io/api/v1/forex/candle";

    const url =
      `${base}?symbol=${encodeURIComponent(mapped.finnhubSymbol)}` +
      `&resolution=${encodeURIComponent(resolution)}` +
      `&from=${encodeURIComponent(String(from))}` +
      `&to=${encodeURIComponent(String(to))}` +
      `&token=${encodeURIComponent(token)}`;

    const r = await fetch(url, { cache: "no-store" });
    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        {
          error: "Finnhub error",
          status: r.status,
          detail: data,
          hint:
            mapped.kind === "forex"
              ? "Forex/Metals candles may require a paid Finnhub plan. US30/US500 proxies (DIA/SPY) should work on free."
              : "Check FINNHUB_API_KEY and that the symbol exists.",
        },
        { status: r.status }
      );
    }

    // Finnhub candle response has: s (status), t (timestamps), o/h/l/c, v
    return NextResponse.json({
      symbol,
      finnhubSymbol: mapped.finnhubSymbol,
      kind: mapped.kind,
      ...data,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", detail: String(e?.message || e) }, { status: 500 });
  }
}

