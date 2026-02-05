import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaxSettings } from './taxesSettings.model';
import { clientType, invoiceStatus, invoiceType } from 'src/domain/enums/invoice.enums';
import { devisType } from 'src/domain/enums/invoice.enums';
import { Libelle } from './libelle.model';
import { Company } from './company.model';

export type InvoiceDocument = Invoice & Document;

@Schema()
export class Invoice {
    _id: Types.ObjectId

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

    @Prop({ default: Date.now })
    Date: Date;


    @Prop({ enum: devisType })
    typeDevis?: devisType;

    @Prop({ default: 1 })
    timbre: number;


    @Prop()
    montantInternational?: number;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: false })
    clientId?: Company ;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: false })
    supplierId?: Company ;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: false })
    mycompanyId?: Company ;

    @Prop()
    notes: string;

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
