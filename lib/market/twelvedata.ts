import { mapToTwelveData, SupportedSymbol } from "./symbols";

export async function twelveDataQuote(symbol: SupportedSymbol) {
  const { tdSymbol } = mapToTwelveData(symbol);
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new Error("Missing TWELVEDATA_API_KEY");

  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(tdSymbol)}&apikey=${encodeURIComponent(key)}`;
  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();

  if (!r.ok || data.status === "error") {
    const err: any = new Error("TwelveData error");
    (err.status = r.status), (err.detail = data);
    throw err;
  }

  return { symbol, tdSymbol, raw: data };
}

export async function twelveDataCandles(symbol: SupportedSymbol, interval: string, startDateISO: string, endDateISO: string) {
  const { tdSymbol } = mapToTwelveData(symbol);
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new Error("Missing TWELVEDATA_API_KEY");

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${encodeURIComponent(interval)}&start_date=${encodeURIComponent(startDateISO)}&end_date=${encodeURIComponent(endDateISO)}&format=JSON&apikey=${encodeURIComponent(key)}`;

  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();

  if (!r.ok || data.status === "error") {
    const err: any = new Error("TwelveData candles error");
    (err.status = r.status), (err.detail = data);
    throw err;
  }

  return { symbol, tdSymbol, raw: data };
}
