import { NextResponse } from "next/server";
import { assertSupportedSymbol, providerFor } from "@/lib/market/symbols";
import { finnhubCandles } from "@/lib/market/finnhub";
import { twelveDataCandles } from "@/lib/market/twelvedata";

export const dynamic = "force-dynamic";

// helper: map our "resolution" to provider interval
function mapResolutionToTD(res: string) {
  // we accept 1,5,15,30,60,D
  if (res === "1") return "1min";
  if (res === "5") return "5min";
  if (res === "15") return "15min";
  if (res === "30") return "30min";
  if (res === "60") return "1h";
  if (res.toUpperCase() === "D") return "1day";
  return "1min";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolRaw = (searchParams.get("symbol") || "").toUpperCase();
    const resolution = searchParams.get("resolution") || "1";
    const from = Number(searchParams.get("from") || "0");
    const to = Number(searchParams.get("to") || "0");

    if (!symbolRaw || !from || !to) {
      return NextResponse.json({ error: "Missing required params: symbol, from, to" }, { status: 400 });
    }

    assertSupportedSymbol(symbolRaw);
    const symbol = symbolRaw;

    const p = providerFor(symbol);

    if (p === "finnhub") {
      // Finnhub candle resolution for stocks: 1,5,15,30,60,D,W,M
      const finnhubRes = ["1","5","15","30","60","D","W","M"].includes(resolution.toUpperCase())
        ? resolution.toUpperCase()
        : "1";
      const out = await finnhubCandles(symbol, finnhubRes, from, to);
      return NextResponse.json(out, { status: 200 });
    } else {
      // Twelve Data uses ISO date ranges
      const interval = mapResolutionToTD(resolution);
      const startISO = new Date(from * 1000).toISOString().slice(0, 19);
      const endISO = new Date(to * 1000).toISOString().slice(0, 19);
      const out = await twelveDataCandles(symbol, interval, startISO, endISO);
      return NextResponse.json(out, { status: 200 });
    }
  } catch (e: any) {
    const code = e?.code || "ERR";
    const status = e?.status || (code === "UNSUPPORTED_SYMBOL" ? 400 : 500);

    if (code === "UNSUPPORTED_SYMBOL") {
      return NextResponse.json(
        { error: "Unsupported symbol", supported: ["EURUSD","XAUUSD","US30","US500"] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: e?.message || "Server error", code, detail: e?.detail || null },
      { status }
    );
  }
}
