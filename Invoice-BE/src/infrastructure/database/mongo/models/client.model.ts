import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Company } from './company.model';

export type ClientDocument = Client & Document;

@Schema()
export class Client {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
    companyId: Company;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true })
    phone: string;

    @Prop()
    taxId?: string;

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

export const ClientSchema = SchemaFactory.createForClass(Client);
