export interface RatesData {
  usd_bcv: number;
  usd_parallel: number;
  eur_bcv: number;
  eur_parallel: number;
  last_updated: string;
  sources: {
    usd_bcv: string;
    usd_parallel: string;
    eur_bcv: string;
    eur_parallel: string;
  };
  trend_commentary: string;
  news: Array<{
    title: string;
    source: string;
    summary: string;
    url: string;
  }>;
  is_fallback?: boolean;
}

export type ActiveInputCurrency = "USD" | "EUR" | "VES";
export type RateType = "bcv" | "parallel";
