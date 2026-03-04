export type SupportedSymbol = "EURUSD" | "XAUUSD" | "US30" | "US500";

export const SUPPORTED: SupportedSymbol[] = ["EURUSD", "XAUUSD", "US30", "US500"];

export function assertSupportedSymbol(symbol: string): asserts symbol is SupportedSymbol {
  if (!SUPPORTED.includes(symbol as SupportedSymbol)) {
    throw new Error("Unsupported symbol");
  }
}

/**
 * Which provider should handle which symbol.
 * - Finnhub free works well for US indices using ETF proxies (DIA/SPY).
 * - Forex/Metals often need a different provider (ex: TwelveData) for EURUSD/XAUUSD.
 */
export function providerFor(symbol: SupportedSymbol): "finnhub" | "twelvedata" {
  if (symbol === "US30" || symbol === "US500") return "finnhub";
  return "twelvedata";
}

/**
 * Map internal symbols -> provider symbols.
 * Finnhub:
 * - US30 => DIA (Dow ETF proxy)
 * - US500 => SPY (S&P 500 ETF proxy)
 * TwelveData (example):
 * - EURUSD => EUR/USD
 * - XAUUSD => XAU/USD
 */
export function mapToFinnhub(symbol: SupportedSymbol): string {
  if (symbol === "US30") return "DIA";
  if (symbol === "US500") return "SPY";
  // Finnhub forex/metals may 403 on free plans
  return symbol;
}

export function mapToTwelveData(symbol: SupportedSymbol): string {
  if (symbol === "EURUSD") return "EUR/USD";
  if (symbol === "XAUUSD") return "XAU/USD";
  // not used for indices by default
  return symbol;
}
