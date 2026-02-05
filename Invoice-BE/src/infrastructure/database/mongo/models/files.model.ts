import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FilesType } from 'src/domain/enums/filesType.enums';
import { User } from '.';

export type FilesDocument = Files & Document;

@Schema()
export class Files {
    _id: Types.ObjectId

    @Prop()
    fileName: string;

    @Prop({ type: Types.ObjectId, ref: User.name })
    uploadedBy: User;

    @Prop()
    fileUrl: string;

    @Prop({enum:FilesType})
    fileRelatedType: FilesType;

    @Prop()
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const FilesSchema = SchemaFactory.createForClass(Files);
