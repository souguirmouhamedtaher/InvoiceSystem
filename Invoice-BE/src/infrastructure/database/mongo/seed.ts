import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import {  Role } from 'src/domain/enums/role.enums';
import { User } from './models';


@Injectable()
export class SeedService {
    private logger: Logger = new Logger('Seed Service');
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async seed() {



        await this.getOrCreateUser('Super', 'Admin', 'sa@invoice.com',[Role.SUPERADMIN]);

        const admin = await this.getOrCreateUser('Admin', 'User', 'user@invoice.com', [ Role.USER]);


        

        await this.userModel.findOne({ email: 'test@invoice.com' });
        this.logger.log('Seed data checked/inserted successfully');
    }






    private async getOrCreateUser(firstName: string, lastName: string, email: string, roles: Role[]): Promise<User> {
        let user = await this.userModel.findOne({ email });
        if (!user) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            user = await this.userModel.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: roles,
                isDeleted: false,
            });
        }
        return user;
    }
}