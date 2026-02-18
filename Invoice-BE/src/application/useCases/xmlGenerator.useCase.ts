import { Injectable } from '@nestjs/common';
import { Invoice } from 'src/domain/entities';
import * as xml2js from 'xml2js';

@Injectable()
export class XmlGeneratorUseCases {
    /**
     * Generate Tunisian Elfatoora TEIF v1.8.8 XML format for an invoice
    * @param invoice - Fully populated invoice with relations (companyId, clientId, Libelle)
     * @returns XML buffer ready for download
     */
    async generateInvoiceXml(invoice: Invoice): Promise<Buffer> {
        const xmlObject = this.buildXmlObject(invoice);
        
        const builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8' },
            renderOpts: { pretty: true, indent: '  ' },
        });
        
        const xmlString = builder.buildObject(xmlObject);
        return Buffer.from(xmlString, 'utf-8');
    }

    private buildXmlObject(invoice: Invoice): any {
        const seller = (invoice as any).companyId;
        const buyer = (invoice as any).clientId;
        
        // Format dates
        const invoiceDate = this.formatDateDDMMYY(invoice.dateInvoice);
        
        // Calculate line totals
        const lines = (invoice.Libelle || []).map((libelle, index) => ({
            ItemIdentifier: (index + 1).toString(),
            LinImd: {
                $: { lang: 'fr' },
                ItemCode: libelle.name || 'ITEM',
                ItemDescription: libelle.description || libelle.name,
            },
            LinQty: {
                Quantity: {
                    $: { measurementUnit: 'UNIT' },
                    _: libelle.qte?.toString() || '1.0',
                },
            },
            LinTax: {
                TaxTypeName: {
                    $: { code: 'I-1602' },
                    _: 'TVA',
                },
                TaxDetails: {
                    TaxRate: libelle.TaxSettingsId?.taxprice || '19',
                },
            },
            LinMoa: {
                MoaDetails: [
                    {
                        Moa: {
                            $: {
                                amountTypeCode: 'I-183',
                                currencyCodeList: 'ISO_4217',
                            },
                            Amount: {
                                $: { currencyIdentifier: 'TND' },
                                _: this.formatAmount(libelle.prixHT),
                            },
                        },
                    },
                    {
                        Moa: {
                            $: {
                                amountTypeCode: 'I-171',
                                currencyCodeList: 'ISO_4217',
                            },
                            Amount: {
                                $: { currencyIdentifier: 'TND' },
                                _: this.formatAmount(libelle.finalprixHT),
                            },
                        },
                    },
                ],
            },
        }));

        // Build tax details
        const taxRates = new Map<string, number>();
        (invoice.Libelle || []).forEach(lib => {
            const rate = lib.TaxSettingsId?.taxprice || '19';
            const taxAmount = parseFloat(lib.finalprixTTC || '0') - parseFloat(lib.finalprixHT || '0');
            taxRates.set(rate, (taxRates.get(rate) || 0) + taxAmount);
        });

        const invoiceTaxDetails = Array.from(taxRates.entries()).map(([rate, amount]) => ({
            Tax: {
                TaxTypeName: {
                    $: { code: 'I-1602' },
                    _: 'TVA',
                },
                TaxDetails: {
                    TaxRate: rate,
                },
            },
            AmountDetails: [
                {
                    Moa: {
                        $: {
                            amountTypeCode: 'I-177',
                            currencyCodeList: 'ISO_4217',
                        },
                        Amount: {
                            $: { currencyIdentifier: 'TND' },
                            _: this.formatAmount(invoice.totalHT),
                        },
                    },
                },
                {
                    Moa: {
                        $: {
                            amountTypeCode: 'I-178',
                            currencyCodeList: 'ISO_4217',
                        },
                        Amount: {
                            $: { currencyIdentifier: 'TND' },
                            _: this.formatAmount(amount.toString()),
                        },
                    },
                },
            ],
        }));

        // Add stamp duty (timbre) if present
        if (invoice.timbre && invoice.timbre > 0) {
            invoiceTaxDetails.push({
                Tax: {
                    TaxTypeName: {
                        $: { code: 'I-1601' },
                        _: 'droit de timbre',
                    },
                    TaxDetails: {
                        TaxRate: '0',
                    },
                },
                AmountDetails: [
                    {
                        Moa: {
                            $: {
                                amountTypeCode: 'I-178',
                                currencyCodeList: 'ISO_4217',
                            },
                            Amount: {
                                $: { currencyIdentifier: 'TND' },
                                _: this.formatAmount(invoice.timbre.toString()),
                            },
                        },
                    },
                ],
            });
        }

        const pytSection = this.buildPytSection(invoice, seller);

        return {
            TEIF: {
                $: {
                    controlingAgency: 'TTN',
                    version: '1.8.8',
                },
                InvoiceHeader: {
                    MessageSenderIdentifier: {
                        $: { type: 'I-01' },
                        _: seller?.Patente || '0000000000000',
                    },
                    MessageRecieverIdentifier: {
                        $: { type: 'I-01' },
                        _: buyer?.taxId || buyer?.Patente || '0000000000000',
                    },
                },
                InvoiceBody: {
                    Bgm: {
                        DocumentIdentifier: invoice.invoiceNumber,
                        DocumentType: {
                            $: { code: 'I-11' },
                            _: 'Facture',
                        },
                    },
                    Dtm: {
                        DateText: {
                            $: {
                                format: 'ddMMyy',
                                functionCode: 'I-31',
                            },
                            _: invoiceDate,
                        },
                    },
                    PartnerSection: {
                        PartnerDetails: [
                            // Seller details
                            {
                                $: { functionCode: 'I-62' },
                                Nad: {
                                    PartnerIdentifier: {
                                        $: { type: 'I-01' },
                                        _: seller?.Patente || '0000000000000',
                                    },
                                    PartnerName: {
                                        $: { nameType: 'Qualification' },
                                        _: seller?.companyname || 'N/A',
                                    },
                                    PartnerAdresses: {
                                        $: { lang: 'fr' },
                                        AdressDescription: seller?.address || '',
                                        Street: seller?.address || '',
                                        CityName: seller?.city || 'Tunis',
                                        PostalCode: '0000',
                                        Country: {
                                            $: { codeList: 'ISO_3166-1' },
                                            _: seller?.country || 'TN',
                                        },
                                    },
                                },
                                RffSection: [
                                    {
                                        Reference: {
                                            $: { refID: 'I-815' },
                                            _: seller?.bankRib || 'N/A',
                                        },
                                    },
                                ],
                                CtaSection: [
                                    {
                                        Contact: {
                                            $: { functionCode: 'I-94' },
                                            ContactIdentifier: seller?.companyname || 'N/A',
                                            ContactName: seller?.companyname || 'N/A',
                                        },
                                        Communication: {
                                            ComMeansType: 'I-101',
                                            ComAdress: seller?.phones?.[0] || seller?.ResponsiblePhone || 'N/A',
                                        },
                                    },
                                    {
                                        Contact: {
                                            $: { functionCode: 'I-94' },
                                            ContactIdentifier: seller?.companyname || 'N/A',
                                            ContactName: seller?.companyname || 'N/A',
                                        },
                                        Communication: {
                                            ComMeansType: 'I-104',
                                            ComAdress: seller?.email || 'N/A',
                                        },
                                    },
                                ],
                            },
                            // Buyer details
                            {
                                $: { functionCode: 'I-64' },
                                Nad: {
                                    PartnerIdentifier: {
                                        $: { type: 'I-01' },
                                        _: buyer?.taxId || buyer?.Patente || '0000000000000',
                                    },
                                    PartnerName: {
                                        $: { nameType: 'Qualification' },
                                        _: buyer?.name || 'N/A',
                                    },
                                    PartnerAdresses: {
                                        $: { lang: 'fr' },
                                        AdressDescription: buyer?.address || '',
                                        Street: buyer?.address || '',
                                        CityName: buyer?.city || 'Tunis',
                                        PostalCode: '0000',
                                        Country: {
                                            $: { codeList: 'ISO_3166-1' },
                                            _: buyer?.country || 'TN',
                                        },
                                    },
                                },
                                RffSection: {
                                    Reference: {
                                        $: { refID: 'I-81' },
                                        _: buyer?.taxId || buyer?.Patente || '0000000000000',
                                    },
                                },
                            },
                        ],
                    },
                    ...(pytSection ? { PytSection: pytSection } : {}),
                    LinSection: {
                        Lin: lines,
                    },
                    InvoiceMoa: {
                        AmountDetails: [
                            {
                                Moa: {
                                    $: {
                                        amountTypeCode: 'I-180',
                                        currencyCodeList: 'ISO_4217',
                                    },
                                    Amount: {
                                        $: { currencyIdentifier: 'TND' },
                                        _: this.formatAmount(invoice.totalTTC),
                                    },
                                    AmountDescription: {
                                        $: { lang: 'fr' },
                                        _: this.numberToWords(parseFloat(invoice.totalTTC || '0')),
                                    },
                                },
                            },
                            {
                                Moa: {
                                    $: {
                                        amountTypeCode: 'I-176',
                                        currencyCodeList: 'ISO_4217',
                                    },
                                    Amount: {
                                        $: { currencyIdentifier: 'TND' },
                                        _: this.formatAmount(invoice.totalHT),
                                    },
                                },
                            },
                            {
                                Moa: {
                                    $: {
                                        amountTypeCode: 'I-181',
                                        currencyCodeList: 'ISO_4217',
                                    },
                                    Amount: {
                                        $: { currencyIdentifier: 'TND' },
                                        _: this.formatAmount(invoice.totalTax),
                                    },
                                },
                            },
                        ],
                    },
                    InvoiceTax: {
                        InvoiceTaxDetails: invoiceTaxDetails,
                    },
                },
            },
        };
    }

    private buildPytSection(invoice: Invoice, seller: any): any | undefined {
        const payments = Array.isArray((invoice as any).payments) ? (invoice as any).payments : [];
        if (!payments.length) return undefined;

        const bankInfo = this.buildPytFii(seller);
        const details = payments.map((payment: any) => {
            const segment: any = {
                Pyt: {
                    PaymentTearmsTypeCode: this.mapPaymentTermsCode(payment.paymentType),
                    PaymentTearmsDescription: this.buildPaymentDescription(payment, seller),
                },
            };

            const paymentDate = payment?.date ? this.formatDateDDMMYY(payment.date) : undefined;
            if (paymentDate) {
                segment.PytDtm = {
                    DateText: {
                        $: { format: 'ddMMyy', functionCode: 'I-32' },
                        _: paymentDate,
                    },
                };
            }

            if (payment?.amount != null) {
                segment.PytMoa = {
                    Moa: {
                        $: { amountTypeCode: 'I-179', currencyCodeList: 'ISO_4217' },
                        Amount: {
                            $: { currencyIdentifier: 'TND' },
                            _: this.formatAmount(payment.amount),
                        },
                    },
                };
            }

            const pai = this.buildPytPai(payment.paymentType);
            if (pai) {
                segment.PytPai = pai;
            }

            if (bankInfo) {
                segment.PytFii = bankInfo;
            }

            return segment;
        });

        return { PytSectionDetails: details };
    }

    private buildPytPai(paymentType?: string): any | undefined {
        const means = this.mapPaymentMeansCode(paymentType);
        const condition = this.mapPaymentTermsCode(paymentType);
        if (!means && !condition) return undefined;
        return {
            PaiConditionCode: condition,
            PaiMeansCode: means,
        };
    }

    private buildPytFii(seller: any): any | undefined {
        if (!seller) return undefined;

        const accountNumber = seller.bankAccountNumber || seller.bankRib || seller.bankIBAN;
        const ownerId = seller.bankOwnerIdentifier;
        const institutionCode = seller.bankInstitutionCode || seller.bankBIC;
        const institutionName = seller.bankInstitutionName || seller.bankName;
        const branchCode = seller.bankBranchCode;
        const bankCountry = seller.bankCountry || seller.country;

        if (!accountNumber && !ownerId && !institutionCode && !institutionName && !branchCode && !bankCountry) {
            return undefined;
        }

        const fii: any = { $: { functionCode: 'I-141' } };

        if (accountNumber || ownerId) {
            fii.AccountHolder = {
                AccountNumber: accountNumber || 'N/A',
                ...(ownerId ? { OwnerIdentifier: ownerId } : {}),
            };
        }

        if (institutionCode || institutionName || branchCode) {
            fii.InstitutionIdentification = {
                $: { nameCode: institutionCode || '0000' },
                ...(branchCode ? { BranchIdentifier: branchCode } : {}),
                ...(institutionName ? { InstitutionName: institutionName } : {}),
            };
        }

        if (bankCountry) {
            fii.Country = {
                $: { codeList: 'ISO_3166-1' },
                _: bankCountry,
            };
        }

        return fii;
    }

    private buildPaymentDescription(payment: any, seller: any): string {
        const method = (payment?.paymentType || 'cash').toString();
        const accountNumber = seller?.bankAccountNumber || seller?.bankRib || seller?.bankIBAN;
        if (method === 'bankTransfer' && accountNumber) {
            return `Virement bancaire vers ${accountNumber}.`;
        }
        if (method === 'cash') {
            return 'Paiement en especes.';
        }
        return `Paiement ${method}.`;
    }

    private mapPaymentTermsCode(paymentType?: string): string {
        switch (paymentType) {
            case 'bankTransfer':
                return 'I-114';
            case 'cheque':
            case 'check':
                return 'I-115';
            default:
                return 'I-114';
        }
    }

    private mapPaymentMeansCode(paymentType?: string): string {
        switch (paymentType) {
            case 'cash':
                return 'CASH';
            case 'bankTransfer':
                return 'BANK';
            case 'creditCard':
                return 'CARD';
            case 'paypal':
                return 'PAYPL';
            case 'cheque':
            case 'check':
                return 'CHECK';
            default:
                return 'CASH';
        }
    }

    private formatDateDDMMYY(date: string): string {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}${month}${year}`;
    }

    private formatAmount(amount: string | number): string {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return num.toFixed(3);
    }

    private numberToWords(amount: number): string {
        // Simple implementation - convert number to French words
        let dinars = Math.floor(amount);
        let millimes = Math.round((amount - Math.floor(amount)) * 1000);
        
        const ones = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
        const tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];
        const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
        
        let result = '';
        
        if (dinars === 0) {
            result = 'ZERO DINAR';
        } else {
            if (dinars >= 1000) {
                const thousands = Math.floor(dinars / 1000);
                result += thousands === 1 ? 'MILLE ' : ones[thousands] + ' MILLE ';
                dinars = dinars % 1000;
            }
            
            if (dinars >= 100) {
                const hundreds = Math.floor(dinars / 100);
                result += hundreds === 1 ? 'CENT ' : ones[hundreds] + ' CENT ';
                dinars = dinars % 100;
            }
            
            if (dinars >= 20) {
                result += tens[Math.floor(dinars / 10)] + ' ';
                dinars = dinars % 10;
            } else if (dinars >= 10) {
                result += teens[dinars - 10] + ' ';
                dinars = 0;
            }
            
            if (dinars > 0) {
                result += ones[dinars] + ' ';
            }
            
            result += dinars > 1 ? 'DINARS' : 'DINAR';
        }
        
        if (millimes > 0) {
            result += ' ET ';
            if (millimes >= 100) {
                const hundreds = Math.floor(millimes / 100);
                result += hundreds === 1 ? 'CENT ' : ones[hundreds] + ' CENT ';
                millimes = millimes % 100;
            }
            
            if (millimes >= 20) {
                result += tens[Math.floor(millimes / 10)] + ' ';
                millimes = millimes % 10;
            } else if (millimes >= 10) {
                result += teens[millimes - 10] + ' ';
                millimes = 0;
            }
            
            if (millimes > 0) {
                result += ones[millimes] + ' ';
            }
            
            result += 'MILLIMES';
        }
        
        return result.trim();
    }
}
