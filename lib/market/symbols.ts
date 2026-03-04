export type Provider = "finnhub" | "twelvedata";

export const SUPPORTED = ["EURUSD", "XAUUSD", "US30", "US500"] as const;
export type SupportedSymbol = typeof SUPPORTED[number];

export function assertSupportedSymbol(s: string): asserts s is SupportedSymbol {
  if (!SUPPORTED.includes(s as any)) {
    throw new Error(`Unsupported symbol: ${s}`);
  }
}

export function providerFor(symbol: SupportedSymbol): Provider {
  // Finnhub free: stocks/ETFs ok (folosim proxy pentru indici)
  if (symbol === "US30" || symbol === "US500") return "finnhub";

  // Forex/Metals: merg pe alt provider (ex: TwelveData)
  return "twelvedata";
}

// Mapare către simbol provider
export function mapToFinnhub(symbol: SupportedSymbol) {
  // proxy ETF pentru indici (free)
  if (symbol === "US30") return { kind: "stock" as const, finnhubSymbol: "DIA" }; // Dow proxy
  if (symbol === "US500") return { kind: "stock" as const, finnhubSymbol: "SPY" }; // S&P500 proxy
  throw new Error("Finnhub mapping not available for this symbol on free plan.");
}

export function mapToTwelveData(symbol: SupportedSymbol) {
  // TwelveData format uzual
  if (symbol === "EURUSD") return { tdSymbol: "EUR/USD" };
  if (symbol === "XAUUSD") return { tdSymbol: "XAU/USD" };
  throw new Error("TwelveData mapping not available for symbol.");
}
