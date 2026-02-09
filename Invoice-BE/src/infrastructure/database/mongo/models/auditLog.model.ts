import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Company } from './company.model';
import { User } from './user.model';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: User;

    @Prop({ type: Types.ObjectId, ref: Company.name })
    companyId?: Company;

    @Prop({ required: true })
    action: string;

    @Prop({ required: true })
    entityType: string;

    @Prop()
    entityId?: Types.ObjectId;

    @Prop({ type: Object })
    metadata?: Record<string, any>;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
