import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from './employee.model';

export type SalaryDocument = Salary & Document;

@Schema({ timestamps: true })
export class Salary {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: Employee.name, required: true })
    employeeId: Employee;

    @Prop({ required: true })
    month: string;

    @Prop({ required: true })
    netAmount: number;

    @Prop()
    paidDate?: string;

    @Prop({ default: false })
    isPaid?: boolean;

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

export const SalarySchema = SchemaFactory.createForClass(Salary);
