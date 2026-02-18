import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaxType } from 'src/domain/enums/tax.enums';
import { Company } from './company.model';

export type TaxSettingsDocument = TaxSettings & Document;

@Schema()
export class TaxSettings {
    _id: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
    companyId: Company;
    
    @Prop()
    name : string;

    @Prop({enum:TaxType})
    taxType: TaxType;
    
    @Prop()
    taxprice: number;
    
    @Prop()
    isactive: boolean;
     

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

export const TaxSettingsSchema = SchemaFactory.createForClass(TaxSettings);
