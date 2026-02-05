import {
    Injectable,
    NotFoundException
} from "@nestjs/common";
import * as crypto from 'crypto';
import { IDataServices, IHashService, IMailerService } from "../../domain/abstracts";
import {  User } from "../../domain/entities";
import { CreateSuperAdminDto, UpdateSuperAdminDto } from "../dtos";
import { UserFactory } from "../factoryMapper";

@Injectable()
export class SuperAdminUseCases {
    constructor(
        private dataServices: IDataServices,
        private hashServices: IHashService,
        private mailService: IMailerService,
        private adminFactory: UserFactory,
    ) { }



    async createSuperAdmin(
        superAdminToCreate: CreateSuperAdminDto
    ): Promise<User> {
        const sa = this.adminFactory.createSa(superAdminToCreate);

        const saExists = await this.dataServices.user.findByAttribute(
            "email",
            sa.email
        );
        if (saExists && !saExists.deletedAt) { // Vérifier que l'utilisateur n'est pas supprimé
            throw new NotFoundException("user  already exist.");
        }

        const password = crypto.randomBytes(12).toString('base64url');
        sa.password = await this.hashServices.hash(password); // hash le password généré
        

       const  onBoardedUser =  await  this.dataServices.user.create(sa);
        this.mailService.onboardingEmailUser({
            userName: onBoardedUser.firstName,
            userEmail: onBoardedUser.email,
            temporaryPassword: password
        });
        
        return onBoardedUser;
    }


    async updateSuperAdmin(
        id: string,
        superAdminToUpdate: UpdateSuperAdminDto
    ): Promise<User> {
        return this.dataServices.user.update(id, superAdminToUpdate);
    }

}
