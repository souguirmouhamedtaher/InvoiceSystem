import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
    _id: Types.ObjectId;

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
