import { NextResponse } from "next/server";
import { mapToFinnhub } from "@/lib/market/symbols";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = (searchParams.get("symbol") || "").trim().toUpperCase();

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

    // Finnhub quote works for stocks/ETFs. For forex, some plans block it.
    // We still try the same /quote endpoint (many accounts return 403 for forex symbols).
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(mapped.finnhubSymbol)}&token=${encodeURIComponent(token)}`;
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
              ? "Forex/Metals may require a paid Finnhub plan. US30/US500 proxies (DIA/SPY) should work on free."
              : "Check FINNHUB_API_KEY and that the symbol exists.",
        },
        { status: r.status }
      );
    }

    // Normalize to a clean response
    // Finnhub quote fields: c=current, h=high, l=low, o=open, pc=prev close, t=timestamp
    return NextResponse.json({
      symbol,
      finnhubSymbol: mapped.finnhubSymbol,
      kind: mapped.kind,
      price: data.c,
      open: data.o,
      high: data.h,
      low: data.l,
      prevClose: data.pc,
      time: data.t,
      raw: data,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", detail: String(e?.message || e) }, { status: 500 });
  }
}
