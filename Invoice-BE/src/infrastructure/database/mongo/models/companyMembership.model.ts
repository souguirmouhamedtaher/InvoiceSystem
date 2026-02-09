import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';
import { Company } from './company.model';
import { User } from './user.model';

export type CompanyMembershipDocument = CompanyMembership & Document;

@Schema({ timestamps: true })
export class CompanyMembership {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: User;

    @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
    companyId: Company;

    @Prop({ enum: CompanyRole, required: true })
    role: CompanyRole;

    @Prop({ type: Types.ObjectId, ref: User.name })
    createdBy?: User;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const CompanyMembershipSchema = SchemaFactory.createForClass(CompanyMembership);
