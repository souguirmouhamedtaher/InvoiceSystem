import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { invoiceStatus, invoiceType } from 'src/domain/enums/invoice.enums';
import { Types } from 'mongoose';

@Injectable()
export class AnalysisUseCases {
    constructor(private dataService: IDataServices) { }

    async getTreasuryAnalysis(year?: number, month?: number, companyId?: string) {
        // 1. Fetch all relevant data (optionally scoped by company)
        const invoiceQuery: any = { deletedAt: null };
        const purchaseQuery: any = { deletedAt: null };
        if (companyId) {
            invoiceQuery.companyId = new Types.ObjectId(companyId);
            purchaseQuery.companyId = new Types.ObjectId(companyId);
        }
        const allInvoices = await this.dataService.invoice.findAllByAttributeWithFilter(invoiceQuery, 1, 100000);
        const allPurchases = await this.dataService.purchaseInvoice.findAllByAttributeWithFilter(purchaseQuery, 1, 100000);

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

    async getVatCumulative(year?: number, month?: number) {
        const fullAnalysis = await this.getTreasuryAnalysis();
        const monthly = fullAnalysis.monthlyBreakdown;

        let runningBalance = 0;
        const cumulativeByMonth = monthly.map((entry) => {
            runningBalance += entry.summary.diffTVA;
            return {
                month: entry.month,
                diffTVA: entry.summary.diffTVA,
                vatToPay: entry.summary.vatToPay,
                carryForwardNextMonth: entry.summary.carryForwardNextMonth || 0,
                cumulativeBalance: runningBalance,
            };
        });

        let filteredResults = cumulativeByMonth;
        if (year) {
            const yearStr = year.toString();
            if (month) {
                const monthStr = month.toString().padStart(2, '0');
                const targetKey = `${yearStr}-${monthStr}`;
                filteredResults = cumulativeByMonth.filter(r => r.month === targetKey);
            } else {
                filteredResults = cumulativeByMonth.filter(r => r.month.startsWith(yearStr));
            }
        }

        const totals = {
            diffTVA: 0,
            cumulativeBalance: 0,
        };

        filteredResults.forEach((entry) => {
            totals.diffTVA += entry.diffTVA;
        });

        if (filteredResults.length > 0) {
            totals.cumulativeBalance = filteredResults[filteredResults.length - 1].cumulativeBalance;
        }

        return {
            period: year ? (month ? `${month}/${year}` : `${year}`) : 'All Time',
            totals,
            monthlyBreakdown: filteredResults,
        };
    }

    async getCashDashboard(year?: number, month?: number, companyId?: string) {
        const invoiceQuery: any = { deletedAt: null };
        const purchaseQuery: any = { deletedAt: null };
        let salaryQuery: any = { deletedAt: null };
        let cnssQuery: any = { deletedAt: null };
        const tvaQuery: any = { deletedAt: null };
        if (companyId) {
            const cid = new Types.ObjectId(companyId);
            invoiceQuery.companyId = cid;
            purchaseQuery.companyId = cid;
            tvaQuery.companyId = cid;
            const companyEmployees = await this.dataService.employee.findAllByAttributeWithFilter(
                { deletedAt: null, companyId: cid }, 1, 100000
            );
            const employeeIds = (companyEmployees || []).map((e: any) => e._id);
            salaryQuery = { deletedAt: null, employeeId: { $in: employeeIds } };
            cnssQuery = { deletedAt: null, employeeId: { $in: employeeIds } };
        } else {
            salaryQuery = { deletedAt: null };
            cnssQuery = { deletedAt: null };
        }

        const [allInvoices, allPurchases, allSalaries, allCnssPayments, allTvaPayments] = await Promise.all([
            this.dataService.invoice.findAllByAttributeWithFilter(invoiceQuery, 1, 100000),
            this.dataService.purchaseInvoice.findAllByAttributeWithFilter(purchaseQuery, 1, 100000),
            this.dataService.salary.findAllByAttributeWithFilter(salaryQuery, 1, 100000),
            this.dataService.cnssPayment.findAllByAttributeWithFilter(cnssQuery, 1, 100000),
            this.dataService.tvaPayment.findAllByAttributeWithFilter(tvaQuery, 1, 100000),
        ]);

        const treasury = await this.getTreasuryAnalysis(undefined, undefined, companyId);
        const vatByMonth = new Map<string, number>();
        treasury.monthlyBreakdown.forEach((entry) => {
            vatByMonth.set(entry.month, entry.summary?.vatToPay || 0);
        });

        const monthlyMap = new Map<string, any>();

        const getMonthKey = (dateStr?: string) => {
            if (!dateStr || dateStr.length < 7) return undefined;
            return dateStr.substring(0, 7);
        };

        const ensureMonth = (key: string) => {
            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, {
                    month: key,
                    totalSales: 0,
                    totalPurchases: 0,
                    vatDue: 0,
                    vatPaid: 0,
                    salariesPaid: 0,
                    cnssPaid: 0,
                    cashBalance: 0,
                });
            }
            return monthlyMap.get(key);
        };

        allInvoices?.forEach((inv: any) => {
            const resolvedType = inv.invoiceType || invoiceType.selling;
            const payments = Array.isArray(inv.payments) ? inv.payments : [];

            if (payments.length > 0) {
                payments.forEach((payment: any) => {
                    const key = getMonthKey(payment.date || inv.dateInvoice);
                    if (!key) return;
                    const bucket = ensureMonth(key);
                    if (resolvedType === invoiceType.buying) {
                        bucket.totalPurchases += Number(payment.amount || 0);
                    } else {
                        bucket.totalSales += Number(payment.amount || 0);
                    }
                });
                return;
            }

            const fallbackAmount = Number(inv.paidAmount || 0);
            const key = getMonthKey(inv.dateInvoice);
            if (!key || fallbackAmount <= 0) return;
            const bucket = ensureMonth(key);
            if (resolvedType === invoiceType.buying) {
                bucket.totalPurchases += fallbackAmount;
            } else {
                bucket.totalSales += fallbackAmount;
            }
        });

        allPurchases?.forEach((pur: any) => {
            if (!pur.isPaid) return;
            const key = getMonthKey(pur.date);
            if (!key) return;
            const bucket = ensureMonth(key);
            bucket.totalPurchases += Number(pur.amountTTC || 0);
        });

        allSalaries?.forEach((salary: any) => {
            const isPaid = Boolean(salary.isPaid) || Boolean(salary.paidDate);
            if (!isPaid) return;
            const key = getMonthKey(salary.paidDate || salary.month);
            if (!key) return;
            const bucket = ensureMonth(key);
            bucket.salariesPaid += Number(salary.netAmount || 0);
        });

        allCnssPayments?.forEach((payment: any) => {
            const key = getMonthKey(payment.paymentDate || payment.month);
            if (!key) return;
            const bucket = ensureMonth(key);
            bucket.cnssPaid += Number(payment.amount || 0);
        });

        allTvaPayments?.forEach((payment: any) => {
            const key = getMonthKey(payment.paymentDate || payment.month);
            if (!key) return;
            const bucket = ensureMonth(key);
            bucket.vatPaid += Number(payment.amount || 0);
        });

        vatByMonth.forEach((vatDue, key) => {
            const bucket = ensureMonth(key);
            bucket.vatDue = vatDue;
        });

        const allEntries = Array.from(monthlyMap.values()).map((entry) => ({
            ...entry,
            cashBalance:
                entry.totalSales -
                (entry.totalPurchases + entry.vatPaid + entry.salariesPaid + entry.cnssPaid),
        }));

        const sortedEntries = allEntries.sort((a, b) => a.month.localeCompare(b.month));

        let filteredResults = sortedEntries;
        if (year) {
            const yearStr = year.toString();
            if (month) {
                const monthStr = month.toString().padStart(2, '0');
                const targetKey = `${yearStr}-${monthStr}`;
                filteredResults = sortedEntries.filter((entry) => entry.month === targetKey);
            } else {
                filteredResults = sortedEntries.filter((entry) => entry.month.startsWith(yearStr));
            }
        }

        const totals = {
            totalSales: 0,
            totalPurchases: 0,
            vatDue: 0,
            vatPaid: 0,
            salariesPaid: 0,
            cnssPaid: 0,
            cashBalance: 0,
        };

        filteredResults.forEach((entry) => {
            totals.totalSales += entry.totalSales;
            totals.totalPurchases += entry.totalPurchases;
            totals.vatDue += entry.vatDue;
            totals.vatPaid += entry.vatPaid;
            totals.salariesPaid += entry.salariesPaid;
            totals.cnssPaid += entry.cnssPaid;
        });

        totals.cashBalance =
            totals.totalSales -
            (totals.totalPurchases + totals.vatPaid + totals.salariesPaid + totals.cnssPaid);

        return {
            period: year ? (month ? `${month}/${year}` : `${year}`) : 'All Time',
            totals,
            monthlyBreakdown: filteredResults,
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
