export enum paymentType {
    cash = 'cash',
    creditCard = 'creditCard',
    bankTransfer = 'bankTransfer',
    paypal = 'paypal',
    check = 'check',
    cheque = 'cheque',

}
export enum invoiceStatus {
    draft = 'draft',
    sent = 'sent',
    paid = 'paid',
    overdue = 'overdue',
    cancelled = 'cancelled',
}

export enum clientType {
    national = 'national',
    international = 'international',
}

export enum devisType {
    TND = 'TND',
    EUR = 'EUR',
    USD = 'USD',
    GBP = 'GBP',
    // add other currencies as needed
}