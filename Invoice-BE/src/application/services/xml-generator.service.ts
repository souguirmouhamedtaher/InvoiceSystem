import { Injectable } from '@nestjs/common';

@Injectable()
export class XmlGeneratorService {
  generateInvoiceXml(invoice: any, company: any, client: any): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<TEIF controlingAgency="TTN" version="1.8.8">
  <InvoiceHeader>
    <MessageSenderIdentifier type="I-01">${this.escapeXml(company.fiscalId || company.companyId || '')}</MessageSenderIdentifier>
    <MessageRecieverIdentifier type="I-01">${this.escapeXml(client.fiscalId || client.companyId || '')}</MessageRecieverIdentifier>
  </InvoiceHeader>
  <InvoiceBody>
    <Bgm>
      <DocumentIdentifier>${this.escapeXml(invoice.invoiceNumber)}</DocumentIdentifier>
      <DocumentType code="I-11">Facture</DocumentType>
    </Bgm>
    <Dtm>
      <DateText format="ddMMyy" functionCode="I-31">${this.formatDate(invoice.invoiceDate)}</DateText>
      <DateText format="ddMMyy" functionCode="I-32">${this.formatDate(invoice.dueDate || invoice.invoiceDate)}</DateText>
    </Dtm>
    <PartnerSection>
      ${this.generatePartnerDetails(company, 'I-62')}
      ${this.generatePartnerDetails(client, 'I-64')}
    </PartnerSection>
    <LinSection>
      ${this.generateLineItems(invoice.items || [])}
    </LinSection>
    <InvoiceMoa>
      ${this.generateAmountDetails(invoice)}
    </InvoiceMoa>
    <InvoiceTax>
      ${this.generateTaxDetails(invoice)}
    </InvoiceTax>
  </InvoiceBody>
</TEIF>`;

    return xml;
  }

  private generatePartnerDetails(partner: any, functionCode: string): string {
    return `<PartnerDetails functionCode="${functionCode}">
        <Nad>
          <PartnerIdentifier type="I-01">${this.escapeXml(partner.fiscalId || partner.companyId || '')}</PartnerIdentifier>
          <PartnerName nameType="Qualification">${this.escapeXml(partner.companyname || partner.name || '')}</PartnerName>
          <PartnerAdresses lang="fr">
            <AdressDescription>${this.escapeXml(partner.address || '')}</AdressDescription>
            <Street>${this.escapeXml(partner.street || '')}</Street>
            <CityName>${this.escapeXml(partner.city || '')}</CityName>
            <PostalCode>${this.escapeXml(partner.postalCode || '')}</PostalCode>
            <Country codeList="ISO_3166-1">TN</Country>
          </PartnerAdresses>
        </Nad>
        ${partner.fiscalId ? `<RffSection>
          <Reference refID="I-815">${this.escapeXml(partner.fiscalId)}</Reference>
        </RffSection>` : ''}
      </PartnerDetails>`;
  }

  private generateLineItems(items: any[]): string {
    return items.map((item, index) => `<Lin>
        <ItemIdentifier>${index + 1}</ItemIdentifier>
        <LinImd lang="fr">
          <ItemCode>${this.escapeXml(item.designation || item.libelle || '')}</ItemCode>
          <ItemDescription>${this.escapeXml(item.designation || item.libelle || '')}</ItemDescription>
        </LinImd>
        <LinQty>
          <Quantity measurementUnit="UNIT">${item.quantity || 1}</Quantity>
        </LinQty>
        <LinTax>
          <TaxTypeName code="I-1602">TVA</TaxTypeName>
          <TaxDetails>
            <TaxRate>${item.tvaRate || 19}</TaxRate>
          </TaxDetails>
        </LinTax>
        <LinMoa>
          <MoaDetails>
            <Moa amountTypeCode="I-183" currencyCodeList="ISO_4217">
              <Amount currencyIdentifier="TND">${this.formatAmount(item.unitPrice || 0)}</Amount>
            </Moa>
          </MoaDetails>
          <MoaDetails>
            <Moa amountTypeCode="I-171" currencyCodeList="ISO_4217">
              <Amount currencyIdentifier="TND">${this.formatAmount((item.unitPrice || 0) * (item.quantity || 1))}</Amount>
            </Moa>
          </MoaDetails>
        </LinMoa>
      </Lin>`).join('\n      ');
  }

  private generateAmountDetails(invoice: any): string {
    const totalHT = invoice.totalHT || 0;
    const totalTVA = invoice.totalTVA || 0;
    const totalTTC = invoice.totalTTC || 0;
    const timbre = invoice.timbre || 0;

    return `<AmountDetails>
        <Moa amountTypeCode="I-179" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${this.formatAmount(totalHT)}</Amount>
        </Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="I-180" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${this.formatAmount(totalTTC)}</Amount>
          <AmountDescription lang="fr">${this.numberToWords(totalTTC)} DINARS</AmountDescription>
        </Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="I-176" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${this.formatAmount(totalHT)}</Amount>
        </Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="I-182" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${this.formatAmount(totalTTC)}</Amount>
        </Moa>
      </AmountDetails>
      <AmountDetails>
        <Moa amountTypeCode="I-181" currencyCodeList="ISO_4217">
          <Amount currencyIdentifier="TND">${this.formatAmount(totalTVA)}</Amount>
        </Moa>
      </AmountDetails>`;
  }

  private generateTaxDetails(invoice: any): string {
    const totalTVA = invoice.totalTVA || 0;
    const totalHT = invoice.totalHT || 0;
    const timbre = invoice.timbre || 0.600;
    const tvaRate = totalHT > 0 ? ((totalTVA / totalHT) * 100).toFixed(1) : '19.0';

    return `<InvoiceTaxDetails>
        <Tax>
          <TaxTypeName code="I-1601">droit de timbre</TaxTypeName>
          <TaxDetails>
            <TaxRate>0</TaxRate>
          </TaxDetails>
        </Tax>
        <AmountDetails>
          <Moa amountTypeCode="I-178" currencyCodeList="ISO_4217">
            <Amount currencyIdentifier="TND">${this.formatAmount(timbre)}</Amount>
          </Moa>
        </AmountDetails>
      </InvoiceTaxDetails>
      <InvoiceTaxDetails>
        <Tax>
          <TaxTypeName code="I-1602">TVA</TaxTypeName>
          <TaxDetails>
            <TaxRate>${tvaRate}</TaxRate>
          </TaxDetails>
        </Tax>
        <AmountDetails>
          <Moa amountTypeCode="I-177" currencyCodeList="ISO_4217">
            <Amount currencyIdentifier="TND">${this.formatAmount(totalHT)}</Amount>
          </Moa>
        </AmountDetails>
        <AmountDetails>
          <Moa amountTypeCode="I-178" currencyCodeList="ISO_4217">
            <Amount currencyIdentifier="TND">${this.formatAmount(totalTVA)}</Amount>
          </Moa>
        </AmountDetails>
      </InvoiceTaxDetails>`;
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  }

  private formatAmount(amount: number): string {
    return amount.toFixed(3);
  }

  private escapeXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private numberToWords(num: number): string {
    // Simplified - just return uppercase number for now
    return num.toFixed(3).toUpperCase().replace('.', ' ET ');
  }
}
