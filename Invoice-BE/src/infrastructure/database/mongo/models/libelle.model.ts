import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaxSettings } from './taxesSettings.model';
import { discountType, productType, unity } from 'src/domain/enums/libelle.enums';
import { Invoice } from './invoice.model';


export type LibelleDocument = Libelle & Document;

  
@Schema()
export class Libelle {
    _id: Types.ObjectId
    
    @Prop()
    name:string;

    @Prop()
    description: string;
    
    @Prop()
    qte: number;

    @Prop({enum: productType})
    productType: productType;
     

    @Prop({enum: unity})
    unity: unity;


    @Prop({ type: Types.ObjectId, ref: TaxSettings.name, required: true })
    TaxSettingsId: TaxSettings; 


    @Prop()
    prixTTC: string;

    @Prop()
    prixHT: string;

    @Prop()
    finalprixHT: string;
    
    @Prop()
    finalprixTTC: string;
    
    @Prop()
    amount_discount: number;
   
    @Prop()
    percentage_discount: number;


    @Prop({enum:discountType})
    discountType: discountType;


    @Prop()
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const LibelleSchema = SchemaFactory.createForClass(Libelle);
