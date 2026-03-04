import { mapToTwelveData, type AppSymbol } from "./symbols";

function requireKey() {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw Object.assign(new Error("Missing TWELVEDATA_API_KEY"), { code: "NO_KEY" });
  return key;
}

export async function twelveDataQuote(symbol: AppSymbol) {
  const key = requireKey();
  const { tdSymbol, kind, label } = mapToTwelveData(symbol);

  // Twelve Data quote endpoint
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${encodeURIComponent(key)}`;
  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();

  if (!r.ok || data?.status === "error") {
    throw Object.assign(new Error("TwelveData error"), { code: "TWELVEDATA_ERR", status: r.status, detail: data });
  }

  return {
    symbol,
    provider: "twelvedata",
    tdSymbol,
    kind,
    label,
    price: Number(data.price),
    open: Number(data.open),
    high: Number(data.high),
    low: Number(data.low),
    prevClose: data.previous_close ? Number(data.previous_close) : null,
    time: data.timestamp ? Number(data.timestamp) : null,
    raw: data,
  };
}

export async function twelveDataCandles(symbol: AppSymbol, interval: string, startDateISO: string, endDateISO: string) {
  const key = requireKey();
  const { tdSymbol, kind, label } = mapToTwelveData(symbol);

  // Twelve Data time_series endpoint
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${encodeURIComponent(interval)}&start_date=${encodeURIComponent(startDateISO)}&end_date=${encodeURIComponent(endDateISO)}&outputsize=5000&apikey=${encodeURIComponent(key)}`;

  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();

  if (!r.ok || data?.status === "error") {
    throw Object.assign(new Error("TwelveData candles error"), { code: "TWELVEDATA_CANDLES_ERR", status: r.status, detail: data });
  }

  // values: [{datetime, open, high, low, close, volume?}] newest->oldest
  const values = Array.isArray(data?.values) ? data.values.slice().reverse() : [];
  const t: number[] = [];
  const o: number[] = [];
  const h: number[] = [];
  const l: number[] = [];
  const c: number[] = [];
  const v: number[] = [];

  for (const row of values) {
    const ts = Math.floor(new Date(row.datetime).getTime() / 1000);
    t.push(ts);
    o.push(Number(row.open));
    h.push(Number(row.high));
    l.push(Number(row.low));
    c.push(Number(row.close));
    v.push(row.volume ? Number(row.volume) : 0);
  }

  return { symbol, provider: "twelvedata", tdSymbol, kind, label, t, o, h, l, c, v, raw: data };
}
