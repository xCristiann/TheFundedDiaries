import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "CANDLES_NOT_AVAILABLE", message: "Finnhub candles endpoint is not available on your plan (403). Use another provider or upgrade Finnhub." },
    { status: 501 }
  );
}
