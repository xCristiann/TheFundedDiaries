import { mapToFinnhub, type AppSymbol } from "./symbols";

function requireKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw Object.assign(new Error("Missing FINNHUB_API_KEY"), { code: "NO_KEY" });
  return key;
}

export async function finnhubQuote(symbol: AppSymbol) {
  const key = requireKey();
  const { finnhubSymbol, kind, label } = mapToFinnhub(symbol);

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${encodeURIComponent(key)}`;
  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();

  if (!r.ok) {
    throw Object.assign(new Error("Finnhub error"), { code: "FINNHUB_ERR", status: r.status, detail: data });
  }

  // Finnhub quote format: c,o,h,l,pc,t
  return {
    symbol,
    provider: "finnhub",
    finnhubSymbol,
    kind,
    label,
    price: data.c,
    open: data.o,
    high: data.h,
    low: data.l,
    prevClose: data.pc,
    time: data.t,
    raw: data,
  };
}

// Finnhub candles (stocks) - optional, but included for chart
export async function finnhubCandles(symbol: AppSymbol, resolution: string, from: number, to: number) {
  const key = requireKey();
  const { finnhubSymbol, kind, label } = mapToFinnhub(symbol);

  // Finnhub resolution: 1,5,15,30,60,D,W,M
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(finnhubSymbol)}&resolution=${encodeURIComponent(resolution)}&from=${from}&to=${to}&token=${encodeURIComponent(key)}`;
  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();

  if (!r.ok || data.s !== "ok") {
    throw Object.assign(new Error("Finnhub candles error"), { code: "FINNHUB_CANDLES_ERR", status: r.status, detail: data });
  }

  // data: t,o,h,l,c,v arrays
  return {
    symbol,
    provider: "finnhub",
    finnhubSymbol,
    kind,
    label,
    t: data.t,
    o: data.o,
    h: data.h,
    l: data.l,
    c: data.c,
    v: data.v,
    raw: data,
  };
}
