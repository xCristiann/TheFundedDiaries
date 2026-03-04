export type AppSymbol = "EURUSD" | "XAUUSD" | "US30" | "US500";

export function assertSupportedSymbol(sym: string): asserts sym is AppSymbol {
  const ok = ["EURUSD","XAUUSD","US30","US500"].includes(sym);
  if (!ok) throw Object.assign(new Error("Unsupported symbol"), { code: "UNSUPPORTED_SYMBOL" });
}

export function providerFor(symbol: AppSymbol) {
  if (symbol === "US30" || symbol === "US500") return "finnhub" as const;
  return "twelvedata" as const;
}

// Finnhub proxies (free)
export function mapToFinnhub(symbol: AppSymbol) {
  if (symbol === "US30") return { finnhubSymbol: "DIA", kind: "stock" as const, label: "US30 (proxy: DIA)" };
  if (symbol === "US500") return { finnhubSymbol: "SPY", kind: "stock" as const, label: "US500 (proxy: SPY)" };
  throw Object.assign(new Error("Symbol not supported by Finnhub mapping"), { code: "BAD_MAPPING" });
}

// Twelve Data FX/Metals
export function mapToTwelveData(symbol: AppSymbol) {
  if (symbol === "EURUSD") return { tdSymbol: "EUR/USD", kind: "forex" as const, label: "EURUSD" };
  if (symbol === "XAUUSD") return { tdSymbol: "XAU/USD", kind: "metal" as const, label: "XAUUSD" };
  throw Object.assign(new Error("Symbol not supported by TwelveData mapping"), { code: "BAD_MAPPING" });
}
