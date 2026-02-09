import { Injectable } from '@nestjs/common';
import { Invoice } from 'src/domain/entities';
import * as xml2js from 'xml2js';

@Injectable()
export class XmlGeneratorUseCases {
    /**
     * Generate Tunisian Elfatoora TEIF v1.8.8 XML format for an invoice
     * @param invoice - Fully populated invoice with relations (mycompanyId, clientId/supplierId, Libelle)
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
        const seller = invoice.mycompanyId;
        const buyer = invoice.invoiceType === 'buying' ? invoice.supplierId : invoice.clientId;
        
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
                        _: buyer?.Patente || '0000000000000',
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
                                            ContactName: seller?.ResponsibleName || seller?.companyname || 'N/A',
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
                                            ContactName: seller?.ResponsibleName || seller?.companyname || 'N/A',
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
                                        _: buyer?.Patente || '0000000000000',
                                    },
                                    PartnerName: {
                                        $: { nameType: 'Qualification' },
                                        _: buyer?.companyname || 'N/A',
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
                                        _: buyer?.Patente || '0000000000000',
                                    },
                                },
                            },
                        ],
                    },
                    PytSection: seller?.bankRib ? {
                        PytSectionDetails: {
                            Pyt: {
                                PaymentTearmsTypeCode: 'I-114',
                                PaymentTearmsDescription: `Les banques sont priees de payer au RIB suivant: ${seller.bankRib}.`,
                            },
                            PytFii: {
                                $: { functionCode: 'I-141' },
                                AccountHolder: {
                                    AccountNumber: seller.bankRib,
                                    OwnerIdentifier: 'RIB',
                                },
                                InstitutionIdentification: {
                                    $: { nameCode: seller.bankName || 'BANK' },
                                    BranchIdentifier: seller.bankBIC || '0000',
                                    InstitutionName: seller.bankName || 'Banque',
                                },
                            },
                        },
                    } : undefined,
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
