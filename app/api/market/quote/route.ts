import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MapItem =
  | { kind: "forex"; finnhubSymbol: string }
  | { kind: "index"; finnhubSymbol: string };

const SYMBOL_MAP: Record<string, MapItem> = {
  EURUSD: { kind: "forex", finnhubSymbol: "OANDA:EUR_USD" },
  XAUUSD: { kind: "forex", finnhubSymbol: "OANDA:XAU_USD" },
  US30:   { kind: "index", finnhubSymbol: "^DJI" },
  US500:  { kind: "index", finnhubSymbol: "^GSPC" },
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * "Quote" implemented via latest candle close (works for forex + indices consistently).
 * Returns: { symbol, price, time, finnhubSymbol, kind }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolIn = (searchParams.get("symbol") || "").toUpperCase().trim();

    if (!symbolIn) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

    const map = SYMBOL_MAP[symbolIn];
    if (!map) {
      return NextResponse.json(
        { error: "Unsupported symbol", supported: Object.keys(SYMBOL_MAP) },
        { status: 400 }
      );
    }

    const token = requireEnv("FINNHUB_API_KEY");

    const now = Math.floor(Date.now() / 1000);
    const from = now - 60 * 20; // last 20 minutes
    const to = now;

    const endpoint =
      map.kind === "forex"
        ? "https://finnhub.io/api/v1/forex/candle"
        : "https://finnhub.io/api/v1/index/candle";

    const url =
      `${endpoint}?symbol=${encodeURIComponent(map.finnhubSymbol)}` +
      `&resolution=1&from=${from}&to=${to}` +
      `&token=${encodeURIComponent(token)}`;

    const r = await fetch(url, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { error: "Finnhub error", status: r.status, detail: data },
        { status: 502 }
      );
    }

    // Expected: data.c (close array), data.t (time array), data.s status
    const closes: number[] = Array.isArray(data?.c) ? data.c : [];
    const times: number[]  = Array.isArray(data?.t) ? data.t : [];

    if (!closes.length || !times.length) {
      return NextResponse.json(
        {
          error: "No data from Finnhub",
          symbol: symbolIn,
          finnhubSymbol: map.finnhubSymbol,
          kind: map.kind,
          raw: data,
        },
        { status: 404 }
      );
    }

    const lastIdx = Math.min(closes.length, times.length) - 1;

    return NextResponse.json({
      symbol: symbolIn,
      finnhubSymbol: map.finnhubSymbol,
      kind: map.kind,
      price: closes[lastIdx],
      time: times[lastIdx], // unix sec
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
