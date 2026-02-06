import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Company } from './company.model';
import { User } from './user.model';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: User;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
    companyId: Company;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop()
    email?: string;

    @Prop()
    phone?: string;

    @Prop({ default: false })
    cnssApplicable: boolean;

    @Prop({ default: 0 })
    monthlyNetSalary: number;

    @Prop({ default: 0 })
    cnssRatePercent?: number;

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

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
