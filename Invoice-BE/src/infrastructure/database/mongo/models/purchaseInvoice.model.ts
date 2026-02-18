import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Company } from './company.model';
import { Supplier } from './supplier.model';
import { paymentType, clientType } from 'src/domain/enums/invoice.enums';

export type PurchaseInvoiceDocument = PurchaseInvoice & Document;

@Schema({ timestamps: true })
export class PurchaseInvoice {
    _id: Types.ObjectId;

    @Prop({ required: true })
    invoiceName: string;

    @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
    companyId: Company;

    @Prop({ type: Types.ObjectId, ref: Supplier.name, required: true })
    supplierId: Supplier;

    @Prop({ required: true })
    date: string;

    @Prop({ required: true })
    amountHT: string;

    @Prop({ required: true })
    tva: string;

    @Prop({ required: true })
    amountTTC: string;

    @Prop()
    file: string;

    @Prop({ default: false })
    isPaid: boolean;

    @Prop({ enum: paymentType })
    paymentType: paymentType;

    @Prop({ enum: clientType })
    clientType: clientType;

    @Prop()
    notes: string;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const PurchaseInvoiceSchema = SchemaFactory.createForClass(PurchaseInvoice);
