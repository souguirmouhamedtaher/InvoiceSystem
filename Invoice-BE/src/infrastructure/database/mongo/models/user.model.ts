import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {  Role } from 'src/domain/enums/role.enums';

export type UserDocument = User & Document;

@Schema()
export class User {
    _id: Types.ObjectId
    
    
    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({ unique: true })
    email: string;

    @Prop()
    password: string;

    @Prop({ type: [String], enum: Role, default: [Role.USER] })
    role: Role[];

    @Prop()
    idNumber: string;

    @Prop()
    birthday: Date;

    @Prop()
    phoneNumber: string;

    @Prop()
    refreshToken: string;

    @Prop()
    avatar: string;

    @Prop()
    otp: string;

    @Prop()
    otpExp: Date;

    @Prop()
    isDeleted: boolean;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
