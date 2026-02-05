import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { companyType } from 'src/domain/enums/company.enums';

export type CompanyDocument = Company & Document;

  
@Schema()
export class Company {
    _id: Types.ObjectId
    
   @Prop()
    companyname : string;

    @Prop({enum:companyType})
    companyType: companyType;

    @Prop()
    logo: string;

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
    address: string;

    @Prop()
    email: string;

    @Prop()
    phones: string[];
    
    @Prop()
    ResponsibleName: string;

    @Prop()
    ResponsibleEmail: string;

    @Prop()
    ResponsiblePhone: string;


    @Prop()
    companySector: string;
   

    @Prop()
    companySubSector: string;
        
    @Prop()
    country: string;

    @Prop()
    city: string;

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
