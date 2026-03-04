export type SupportedSymbol = "EURUSD" | "XAUUSD" | "US30" | "US500";

/**
 * Finnhub reality:
 * - Free plan is reliable for US equities/ETFs via /quote and /stock/candle.
 * - Forex/Metals endpoints may be blocked (403) depending on plan.
 *
 * We map CFD-style symbols to something testable:
 *  US30  -> DIA (Dow ETF)
 *  US500 -> SPY (S&P500 ETF)
 *
 * Forex/metals try via OANDA symbols (may 403 on your plan):
 *  EURUSD -> OANDA:EUR_USD
 *  XAUUSD -> OANDA:XAU_USD
 */
export function mapToFinnhub(symbol: string): { kind: "stock" | "forex"; finnhubSymbol: string } | null {
  switch (symbol) {
    case "US30":
      return { kind: "stock", finnhubSymbol: "DIA" };
    case "US500":
      return { kind: "stock", finnhubSymbol: "SPY" };
    case "EURUSD":
      return { kind: "forex", finnhubSymbol: "OANDA:EUR_USD" };
    case "XAUUSD":
      return { kind: "forex", finnhubSymbol: "OANDA:XAU_USD" };
    default:
      return null;
  }
}
