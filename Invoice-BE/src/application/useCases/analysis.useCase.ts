import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { invoiceStatus, invoiceType } from 'src/domain/enums/invoice.enums';

@Injectable()
export class AnalysisUseCases {
    constructor(private dataService: IDataServices) { }

    async getTreasuryAnalysis(year?: number, month?: number) {
        // 1. Fetch all relevant data
        // If year is provided, we fetch data for that year. 
        // To calculate carry-forward accurately, we ideally need all data from the beginning.
        // For performance, let's fetch everything that is not deleted.
        const allInvoices = await this.dataService.invoice.findAllByAttributeWithFilter({ deletedAt: null }, 1, 100000);
        const allPurchases = await this.dataService.purchaseInvoice.findAllByAttributeWithFilter({ deletedAt: null }, 1, 100000);

        // 2. Group by Month/Year
        // We'll create a map: "YYYY-MM" -> { sales: {...}, purchases: {...} }
        const monthlyStats = new Map<string, any>();

        const getMonthKey = (dateStr: string) => {
            // dateStr is usually YYYY-MM-DD
            if (!dateStr) return 'unknown';
            return dateStr.substring(0, 7); // "YYYY-MM"
        };

        // Process invoices (selling => sales, buying => purchases)
        allInvoices?.forEach((inv) => {
            const key = getMonthKey(inv.dateInvoice);
            if (!monthlyStats.has(key)) {
                monthlyStats.set(key, this.getDefaultMonthlyData());
            }
            const stats = monthlyStats.get(key);

            const resolvedType = inv.invoiceType || invoiceType.selling;
            const bucket = resolvedType === invoiceType.buying ? stats.purchases : stats.sales;

            bucket.totalHT += parseFloat(inv.totalHT || '0');
            bucket.totalTTC += parseFloat(inv.totalTTC || '0');
            bucket.totalTVA += parseFloat(inv.totalTax || '0');
            if (inv.invoiceStatus === invoiceStatus.paid) {
                bucket.paidCount++;
            } else {
                bucket.unpaidCount++;
            }
        });

        // Process Purchases
        allPurchases?.forEach((pur) => {
            const key = getMonthKey(pur.date);
            if (!monthlyStats.has(key)) {
                monthlyStats.set(key, this.getDefaultMonthlyData());
            }
            const stats = monthlyStats.get(key);
            stats.purchases.totalHT += parseFloat(pur.amountHT || '0');
            stats.purchases.totalTTC += parseFloat(pur.amountTTC || '0');
            stats.purchases.totalTVA += parseFloat(pur.tva || '0');
            if (pur.isPaid) {
                stats.purchases.paidCount++;
            } else {
                stats.purchases.unpaidCount++;
            }
        });

        // 3. Sort keys and calculate Carry Forward
        const sortedKeys = Array.from(monthlyStats.keys()).sort();
        let cumulativeCarryForward = 0;

        const resultByMonth = sortedKeys.map((key) => {
            const stats = monthlyStats.get(key);

            // Calculate VAT for this month
            // Vente TVA - Achat TVA
            const monthlyVatDiff = stats.sales.totalTVA - stats.purchases.totalTVA;

            // Net VAT considering previous carry forward
            let netVat = monthlyVatDiff - cumulativeCarryForward;

            if (netVat < 0) {
                // We have a credit (carry forward)
                cumulativeCarryForward = Math.abs(netVat);
                stats.summary.vatToPay = 0;
                stats.summary.carryForwardNextMonth = cumulativeCarryForward;
            } else {
                // We have VAT to pay
                stats.summary.vatToPay = netVat;
                stats.summary.carryForwardNextMonth = 0;
                cumulativeCarryForward = 0;
            }

            stats.summary.diffHT = stats.sales.totalHT - stats.purchases.totalHT;
            stats.summary.diffTTC = stats.sales.totalTTC - stats.purchases.totalTTC;
            stats.summary.diffTVA = monthlyVatDiff;

            return {
                month: key,
                ...stats,
            };
        });

        // 4. Filter the results based on user request
        let filteredResults = resultByMonth;
        if (year) {
            const yearStr = year.toString();
            if (month) {
                const monthStr = month.toString().padStart(2, '0');
                const targetKey = `${yearStr}-${monthStr}`;
                filteredResults = resultByMonth.filter(r => r.month === targetKey);
            } else {
                filteredResults = resultByMonth.filter(r => r.month.startsWith(yearStr));
            }
        }

        // 5. Total aggregation for the period
        const totals = {
            sales: { totalHT: 0, totalTTC: 0, totalTVA: 0, paidCount: 0, unpaidCount: 0 },
            purchases: { totalHT: 0, totalTTC: 0, totalTVA: 0, paidCount: 0, unpaidCount: 0 },
            summary: { diffHT: 0, diffTTC: 0, diffTVA: 0, vatToPay: 0 }
        };

        filteredResults.forEach(r => {
            totals.sales.totalHT += r.sales.totalHT;
            totals.sales.totalTTC += r.sales.totalTTC;
            totals.sales.totalTVA += r.sales.totalTVA;
            totals.sales.paidCount += r.sales.paidCount;
            totals.sales.unpaidCount += r.sales.unpaidCount;

            totals.purchases.totalHT += r.purchases.totalHT;
            totals.purchases.totalTTC += r.purchases.totalTTC;
            totals.purchases.totalTVA += r.purchases.totalTVA;
            totals.purchases.paidCount += r.purchases.paidCount;
            totals.purchases.unpaidCount += r.purchases.unpaidCount;

            totals.summary.diffHT += r.summary.diffHT;
            totals.summary.diffTTC += r.summary.diffTTC;
            totals.summary.diffTVA += r.summary.diffTVA;
            totals.summary.vatToPay += r.summary.vatToPay;
        });

        return {
            period: year ? (month ? `${month}/${year}` : `${year}`) : 'All Time',
            totals,
            monthlyBreakdown: filteredResults
        };
    }

    private getDefaultMonthlyData() {
        return {
            sales: {
                totalHT: 0,
                totalTTC: 0,
                totalTVA: 0,
                paidCount: 0,
                unpaidCount: 0
            },
            purchases: {
                totalHT: 0,
                totalTTC: 0,
                totalTVA: 0,
                paidCount: 0,
                unpaidCount: 0
            },
            summary: {
                diffHT: 0,
                diffTTC: 0,
                diffTVA: 0,
                vatToPay: 0,
                carryForwardNextMonth: 0
            }
        };
    }
}
