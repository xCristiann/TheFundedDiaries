import { mapToFinnhub, SupportedSymbol } from "./symbols";

export async function finnhubQuote(symbol: SupportedSymbol) {
  const { finnhubSymbol, kind } = mapToFinnhub(symbol);
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("Missing FINNHUB_API_KEY");

  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${encodeURIComponent(key)}`, {
    cache: "no-store",
  });

  const data = await r.json();
  if (!r.ok) {
    const err: any = new Error("Finnhub error");
    (err.status = r.status), (err.detail = data);
    throw err;
  }

  return { symbol, finnhubSymbol, kind, raw: data };
}

export async function finnhubCandles(symbol: SupportedSymbol, resolution: string, from: number, to: number) {
  const { finnhubSymbol, kind } = mapToFinnhub(symbol);
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("Missing FINNHUB_API_KEY");

  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(finnhubSymbol)}&resolution=${encodeURIComponent(resolution)}&from=${from}&to=${to}&token=${encodeURIComponent(key)}`;

  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();
  if (!r.ok || data.s === "no_data") {
    const err: any = new Error("Finnhub candles error");
    (err.status = r.status), (err.detail = data);
    throw err;
  }

  return { symbol, finnhubSymbol, kind, raw: data };
}
