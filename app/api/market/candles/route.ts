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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const symbolIn = (searchParams.get("symbol") || "").toUpperCase().trim();
    const resolution = (searchParams.get("resolution") || "1").trim(); // 1,5,15,30,60,D,W,M
    const from = searchParams.get("from"); // unix seconds
    const to = searchParams.get("to");     // unix seconds

    if (!symbolIn) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
    if (!from || !to) return NextResponse.json({ error: "Missing from/to (unix seconds)" }, { status: 400 });

    const map = SYMBOL_MAP[symbolIn];
    if (!map) {
      return NextResponse.json(
        { error: "Unsupported symbol", supported: Object.keys(SYMBOL_MAP) },
        { status: 400 }
      );
    }

    const token = requireEnv("FINNHUB_API_KEY");

    const endpoint =
      map.kind === "forex"
        ? "https://finnhub.io/api/v1/forex/candle"
        : "https://finnhub.io/api/v1/index/candle";

    const url =
      `${endpoint}?symbol=${encodeURIComponent(map.finnhubSymbol)}` +
      `&resolution=${encodeURIComponent(resolution)}` +
      `&from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}` +
      `&token=${encodeURIComponent(token)}`;

    const r = await fetch(url, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { error: "Finnhub error", status: r.status, detail: data },
        { status: 502 }
      );
    }

    // Finnhub returns: { c,h,l,o,t,v,s }
    // We also return the internal symbol and finnhub symbol for debugging.
    return NextResponse.json({
      symbol: symbolIn,
      finnhubSymbol: map.finnhubSymbol,
      kind: map.kind,
      ...data,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
