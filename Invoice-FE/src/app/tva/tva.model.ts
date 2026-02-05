export type VatBucket = {
  totalHT: number;
  totalTTC: number;
  totalTVA: number;
  paidCount: number;
  unpaidCount: number;
};

export type VatSummary = {
  diffHT: number;
  diffTTC: number;
  diffTVA: number;
  vatToPay: number;
  carryForwardNextMonth?: number;
};

export type VatMonthlyBreakdown = {
  month: string;
  sales: VatBucket;
  purchases: VatBucket;
  summary: VatSummary;
};

export type VatTotalsResponse = {
  period: string;
  totals: {
    sales: VatBucket;
    purchases: VatBucket;
    summary: VatSummary;
  };
  monthlyBreakdown: VatMonthlyBreakdown[];
};

export type VatCumulativeEntry = {
  month: string;
  diffTVA: number;
  vatToPay: number;
  carryForwardNextMonth: number;
  cumulativeBalance: number;
};

export type VatCumulativeResponse = {
  period: string;
  totals: {
    diffTVA: number;
    cumulativeBalance: number;
  };
  monthlyBreakdown: VatCumulativeEntry[];
};
