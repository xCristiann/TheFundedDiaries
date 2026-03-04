import { NextResponse } from "next/server";
import { assertSupportedSymbol, providerFor } from "@/lib/market/symbols";
import { finnhubCandles } from "@/lib/market/finnhub";
import { twelveDataCandles } from "@/lib/market/twelvedata";

export const dynamic = "force-dynamic";

function toSec(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  // dacă e ms (13 cifre), convertim în sec
  return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = assertSupportedSymbol(searchParams.get("symbol"));
    const resolution = Number(searchParams.get("resolution") ?? "1") || 1;

    const now = Math.floor(Date.now() / 1000);
    const to = toSec(searchParams.get("to"), now);
    const from = toSec(searchParams.get("from"), to - 60 * 120); // default 2h

    if (from >= to) {
      return NextResponse.json({ error: "Invalid range", from, to }, { status: 400 });
    }

    const provider = providerFor(symbol);

    const data =
      provider === "finnhub"
        ? await finnhubCandles(symbol, { resolution, from, to })
        : await twelveDataCandles(symbol, { resolution, from, to });

    return NextResponse.json({ symbol, provider, resolution, from, to, data });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Candles error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
