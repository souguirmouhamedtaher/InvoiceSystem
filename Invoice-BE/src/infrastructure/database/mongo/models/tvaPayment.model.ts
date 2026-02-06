import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.model';
import { Company } from './company.model';

export type TvaPaymentDocument = TvaPayment & Document;

@Schema({ timestamps: true })
export class TvaPayment {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: User;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
    companyId: Company;

    @Prop({ required: true })
    month: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    paymentDate: string;

    @Prop()
    proofUrl?: string;

    @Prop()
    notes?: string;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const TvaPaymentSchema = SchemaFactory.createForClass(TvaPayment);
