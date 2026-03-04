import { NextResponse } from "next/server";
import { assertSupportedSymbol, providerFor } from "@/lib/market/symbols";
import { finnhubQuote } from "@/lib/market/finnhub";
import { twelveDataQuote } from "@/lib/market/twelvedata";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolRaw = (searchParams.get("symbol") || "").toUpperCase();
    assertSupportedSymbol(symbolRaw);
    const symbol = symbolRaw;

    const p = providerFor(symbol);
    const out = p === "finnhub" ? await finnhubQuote(symbol) : await twelveDataQuote(symbol);

    return NextResponse.json(out, { status: 200 });
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
