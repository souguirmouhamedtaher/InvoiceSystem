export type CashDashboardTotals = {
  totalSales: number;
  totalPurchases: number;
  vatDue: number;
  vatPaid: number;
  salariesPaid: number;
  cnssPaid: number;
  cashBalance: number;
};

export type CashDashboardMonth = {
  month: string;
  totalSales: number;
  totalPurchases: number;
  vatDue: number;
  vatPaid: number;
  salariesPaid: number;
  cnssPaid: number;
  cashBalance: number;
};

export type CashDashboardResponse = {
  period: string;
  totals: CashDashboardTotals;
  monthlyBreakdown: CashDashboardMonth[];
};
