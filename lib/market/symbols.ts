export type SupportedSymbol = "EURUSD" | "XAUUSD" | "US30" | "US500";
export type ProviderKind = "stock" | "forex" | "metal";
export type ProviderName = "finnhub" | "twelvedata";

export const SUPPORTED: SupportedSymbol[] = ["EURUSD", "XAUUSD", "US30", "US500"];

export function assertSupportedSymbol(symbol: string): asserts symbol is SupportedSymbol {
  if (!SUPPORTED.includes(symbol as SupportedSymbol)) {
    throw new Error("Unsupported symbol");
  }
}

/**
 * Provider routing:
 * - Finnhub free works for US indices via ETF proxies (DIA/SPY)
 * - Forex/Metals often require another provider (ex: TwelveData)
 */
export function providerFor(symbol: SupportedSymbol): ProviderName {
  if (symbol === "US30" || symbol === "US500") return "finnhub";
  return "twelvedata";
}

/**
 * Finnhub mapping (object, as your finnhub.ts expects)
 */
export function mapToFinnhub(symbol: SupportedSymbol): { finnhubSymbol: string; kind: ProviderKind } {
  if (symbol === "US30") return { finnhubSymbol: "DIA", kind: "stock" };   // Dow ETF proxy
  if (symbol === "US500") return { finnhubSymbol: "SPY", kind: "stock" };  // S&P500 ETF proxy

  // Finnhub forex/metals may 403 on free plans, but keep mapping consistent
  if (symbol === "EURUSD") return { finnhubSymbol: "OANDA:EUR_USD", kind: "forex" };
  if (symbol === "XAUUSD") return { finnhubSymbol: "OANDA:XAU_USD", kind: "metal" };

  return { finnhubSymbol: symbol, kind: "stock" };
}

/**
 * TwelveData mapping (string, used by your twelvedata.ts)
 */
export function mapToTwelveData(symbol: SupportedSymbol): { tdSymbol: string; kind: ProviderKind } {
  if (symbol === "EURUSD") return { tdSymbol: "EUR/USD", kind: "forex" };
  if (symbol === "XAUUSD") return { tdSymbol: "XAU/USD", kind: "metal" };
  if (symbol === "US30") return { tdSymbol: "DIA", kind: "stock" };
  if (symbol === "US500") return { tdSymbol: "SPY", kind: "stock" };
  return { tdSymbol: symbol, kind: "stock" };
}
