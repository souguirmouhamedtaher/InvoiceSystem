import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from './employee.model';
import { User } from './user.model';

export type CnssPaymentDocument = CnssPayment & Document;

@Schema({ timestamps: true })
export class CnssPayment {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: User;

    @Prop({ type: Types.ObjectId, ref: Employee.name, required: true })
    employeeId: Employee;

    @Prop({ required: true })
    month: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    paymentDate: string;

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

export const CnssPaymentSchema = SchemaFactory.createForClass(CnssPayment);
