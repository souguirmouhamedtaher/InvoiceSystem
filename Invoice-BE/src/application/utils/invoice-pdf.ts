import fs = require('fs');
import path = require('path');
import Handlebars from 'handlebars';
import QRCode = require('qrcode');
import { chromium } from 'playwright';
import { Invoice } from 'src/domain/entities';

export type VatSummaryRow = {
  rate: number;
  base: number;
  tva: number;
};

export type InvoicePdfTotals = {
  totalHT: number;
  totalTVA: number;
  timbre: number;
  totalTTC: number;
};

const formatMoney = (value: number) => value.toFixed(2);

const formatDate = (value?: string | Date) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (value?: string | Date) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const numberToFrench = (num: number): string => {
  const units = [
    'zero',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
  ];
  const tens = [
    '',
    'dix',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante',
    'quatre-vingt',
    'quatre-vingt',
  ];

  const underHundred = (n: number): string => {
    if (n < 17) return units[n];
    if (n < 20) return `dix ${units[n - 10]}`;
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (n < 70) {
      if (u === 0) return tens[t];
      if (u === 1 && t !== 8) return `${tens[t]} et un`;
      return `${tens[t]} ${units[u]}`;
    }
    if (n < 80) {
      const rest = n - 60;
      return rest === 11 ? 'soixante et onze' : `soixante ${underHundred(rest)}`;
    }
    const rest = n - 80;
    if (rest === 0) return 'quatre-vingt';
    return `quatre-vingt ${underHundred(rest)}`;
  };

  const underThousand = (n: number): string => {
    if (n < 100) return underHundred(n);
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const hundredBase = h === 1 ? 'cent' : `${units[h]} cent`;
    if (rest === 0) {
      return h > 1 ? `${hundredBase}s` : hundredBase;
    }
    return `${hundredBase} ${underHundred(rest)}`;
  };

  const chunks = [
    { value: 1000000000, label: 'milliard' },
    { value: 1000000, label: 'million' },
    { value: 1000, label: 'mille' },
  ];

  let remaining = Math.floor(num);
  if (remaining === 0) return units[0];

  const parts: string[] = [];
  for (const chunk of chunks) {
    const qty = Math.floor(remaining / chunk.value);
    if (qty > 0) {
      const chunkText = qty === 1 && chunk.label === 'mille'
        ? 'mille'
        : `${underThousand(qty)} ${chunk.label}${qty > 1 ? 's' : ''}`;
      parts.push(chunkText.trim());
      remaining = remaining % chunk.value;
    }
  }

  if (remaining > 0) {
    parts.push(underThousand(remaining));
  }

  return parts.join(' ');
};

const amountToFrenchText = (amount: number) => {
  const dinars = Math.floor(amount);
  const millimes = Math.round((amount - dinars) * 1000);
  const dinarsText = numberToFrench(dinars);
  const millimesText = numberToFrench(millimes);
  return `${dinarsText} dinars ${millimesText} millimes`;
};

const resolveTemplatePath = () => {
  const candidates = [
    path.resolve(process.cwd(), 'src/application/templates/invoice-pdf.hbs'),
    path.resolve(process.cwd(), 'dist/application/templates/invoice-pdf.hbs'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Invoice PDF template not found.');
};

export const buildInvoicePdfBuffer = async (params: {
  invoice: Invoice;
  totals: InvoicePdfTotals;
  vatRows: VatSummaryRow[];
  fromLabel: string;
  toLabel: string;
}) => {
  const { invoice, totals, vatRows, fromLabel, toLabel } = params;
  const createdAt = invoice.createdAt || invoice.Date || new Date();

  const items = (Array.isArray(invoice.Libelle) ? invoice.Libelle : []).map((line: any, index: number) => {
    const base = parseFloat(line.finalprixHT || '0');
    const ttc = parseFloat(line.finalprixTTC || '0');
    const taxRate = line.TaxSettingsId?.taxprice
      ? Number(line.TaxSettingsId.taxprice)
      : base > 0
        ? (Math.max(0, ttc - base) / base) * 100
        : 0;

    return {
      code: String(index + 1),
      designation: String(line.name || '-'),
      quantity: String(line.qte || 0),
      taxRate: taxRate.toFixed(2),
      unitPrice: formatMoney(parseFloat(line.prixHT || '0')),
      totalHT: formatMoney(base),
      totalTTC: formatMoney(ttc),
    };
  });

  const payments = (Array.isArray(invoice.payments) ? invoice.payments : []).map((payment: any) => ({
    date: payment.date || '-',
    mode: payment.paymentType || '-',
    amount: formatMoney(Number(payment.amount || 0)),
    proof: payment.proofUrl ? 'OK' : '-',
  }));

  const qrPayload = JSON.stringify({
    id: invoice._id,
    number: invoice.invoiceNumber,
    date: invoice.dateInvoice,
    total: totals.totalTTC,
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 240 });

  const templatePath = resolveTemplatePath();
  const template = fs.readFileSync(templatePath, 'utf8');
  const compileTemplate = Handlebars.compile(template);

  const mycompany = (invoice as any).companyId || {};
  const bankDetails = {
    bankName: mycompany.bankName || null,
    bankRib: mycompany.bankRib || null,
    bankIBAN: mycompany.bankIBAN || null,
    bankBIC: mycompany.bankBIC || null,
  };

  const html = compileTemplate({
    invoiceNumber: invoice.invoiceNumber || String(invoice._id || ''),
    date: formatDate(invoice.dateInvoice),
    time: formatTime(createdAt),
    typeLabel: invoice.invoiceType === 'buying' ? 'Facture d\'achat' : 'Facture de vente',
    savedAt: formatDate(createdAt),
    fromLabel,
    toLabel,
    contact: invoice.username || '-',
    items,
    payments,
    bankDetails,
    vatRows: vatRows.map((row) => ({
      rate: row.rate.toFixed(2),
      base: formatMoney(row.base),
      tva: formatMoney(row.tva),
    })),
    totals: {
      totalHT: formatMoney(totals.totalHT),
      totalTVA: formatMoney(totals.totalTVA),
      timbre: formatMoney(totals.timbre),
      totalTTC: formatMoney(totals.totalTTC),
    },
    amountText: amountToFrenchText(totals.totalTTC),
    qrDataUrl,
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });

  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
  });

  await page.close();
  await browser.close();

  return buffer;
};
