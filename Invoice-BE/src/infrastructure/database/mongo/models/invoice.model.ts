import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaxSettings } from './taxesSettings.model';
import { clientType, invoiceStatus, invoiceType, paymentType } from 'src/domain/enums/invoice.enums';
import { devisType } from 'src/domain/enums/invoice.enums';
import { Libelle } from './libelle.model';
import { Company } from './company.model';
import { Client } from './client.model';

export type InvoiceDocument = Invoice & Document;

@Schema({ _id: false })
export class InvoicePayment {
    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    date: string;

    @Prop({ enum: paymentType, required: true })
    paymentType: paymentType;

    @Prop()
    proofUrl?: string;

    @Prop()
    notes?: string;
}

@Schema()
export class Invoice {
    _id: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop()
    username: string;

    @Prop()
    dateInvoice: string;

    @Prop()
    applicationName: string;

    @Prop({ enum: clientType })
    clientType: clientType;

    @Prop({ enum: invoiceType, default: invoiceType.selling })
    invoiceType: invoiceType;

    @Prop({ enum: invoiceStatus })
    invoiceStatus: invoiceStatus;


    @Prop({ type: [Types.ObjectId], ref: TaxSettings.name, required: true })
    AdditionalTaxSettings: TaxSettings[];



    @Prop({ type: [Types.ObjectId], ref: Libelle.name, required: true })
    Libelle: Libelle[];


    @Prop()
    invoiceNumber: string;

    @Prop()
    totalTTC: string;

    @Prop()
    totalHT: string;

    @Prop()
    totalTax: string;

    @Prop()
    totalDiscount: string;

    @Prop()
    fileUrl?: string;

    @Prop({ default: Date.now })
    Date: Date;


    @Prop({ enum: devisType })
    typeDevis?: devisType;

    @Prop({ default: 1 })
    timbre: number;


    @Prop()
    montantInternational?: number;

    @Prop({ type: Types.ObjectId, ref: Client.name, required: false })
    clientId?: Client ;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
    companyId: Company ;

    @Prop()
    notes: string;

    @Prop({ type: [InvoicePayment], default: [] })
    payments: InvoicePayment[];

    @Prop({ default: 0 })
    paidAmount: number;

    @Prop({ default: 0 })
    remainingAmount: number;

    @Prop()
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
