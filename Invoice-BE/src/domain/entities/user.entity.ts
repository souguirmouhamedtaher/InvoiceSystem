import {Role } from "../enums/role.enums";
import { Base } from "./base.entity";

export class User extends Base {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthday: Date;
    phoneNumber: string;
    idNumber: string;
    role: Role[];
    refreshToken: string;
    records?:any
    avatar: string;
    otp: string;
    otpExp: Date;
}