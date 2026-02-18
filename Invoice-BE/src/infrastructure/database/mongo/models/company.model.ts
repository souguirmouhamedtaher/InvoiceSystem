import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.model';

export type CompanyDocument = Company & Document;

  
@Schema({ collection: 'companies' })
export class Company {
    _id: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: User;
    
    @Prop({ required: true })
    companyname : string;

    @Prop()
    Patente: string;

    @Prop()
    bankName: string;

    @Prop()
    bankIBAN: string;

    @Prop()
    bankRib: string;

    @Prop()
    bankBIC: string;

    @Prop()
    bankAccountNumber?: string;

    @Prop()
    bankOwnerIdentifier?: string;

    @Prop()
    bankInstitutionCode?: string;

    @Prop()
    bankInstitutionName?: string;

    @Prop()
    bankBranchCode?: string;

    @Prop()
    bankCountry?: string;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true })
    email: string;

    @Prop({ type: [String], default: [] })
    phones: string[];
        
    @Prop()
    region: string;

    @Prop()
    country: string;

    @Prop()
    notes: string;
    
    @Prop()
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
