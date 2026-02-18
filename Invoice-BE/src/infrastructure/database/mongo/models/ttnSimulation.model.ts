import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Invoice } from './invoice.model';
import { Company } from './company.model';
import { User } from './user.model';
import { TtnSimulationStatus } from 'src/domain/entities/ttnSimulation.entity';

export type TtnSimulationDocument = TtnSimulation & Document;

@Schema({ timestamps: true })
export class TtnSimulation {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: Invoice.name, required: true })
    invoiceId: Invoice;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
    companyId: Company;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: User;

    @Prop({ required: true })
    requestXml: string;

    @Prop()
    responseXml?: string;

    @Prop({ required: true, enum: ['ACCEPTED', 'REJECTED'] })
    status: TtnSimulationStatus;

    @Prop()
    reference?: string;

    @Prop({ type: [String], default: [] })
    errors?: string[];

    @Prop()
    source?: string;

    @Prop()
    submittedAt?: Date;

    @Prop()
    processedAt?: Date;

    @Prop()
    durationMs?: number;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const TtnSimulationSchema = SchemaFactory.createForClass(TtnSimulation);
