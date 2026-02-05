import {
    ConflictException,
    Injectable,
    NotFoundException
} from "@nestjs/common";

import * as crypto from 'crypto';
import { IDataServices, IHashService, IMailerService } from "../../domain/abstracts";
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto } from "../dtos";
import { UserFactory } from "../factoryMapper";
import { User } from "src/domain/entities";
import { Role } from "src/domain/enums/role.enums";

@Injectable()
export class UserUseCases {
    constructor(
        private dataService: IDataServices,
        private userFactory: UserFactory,
        private mailService: IMailerService,
        private hashService: IHashService
    ) { }

    async getAllUsers(
        role?: string[], 
        page: number = 1, 
        limit: number = 20 , 
        search?: { [key: string]: any }
    ): Promise<{ Users: User[]; totalUsers: number }> {
        const query: any = {};  
        const orQueries: any[] = [];

        if (role) {
            query.role = { $in: role };  
        }

            if (search) {
        for (const [key, value] of Object.entries(search)) {
            if (['firstName', 'lastName'].includes(key) && typeof value === 'string') {
                orQueries.push({
                    [key]: { $regex: value, $options: 'i' }
                });
            } else if (key === 'search' && typeof value === 'string') {
                const searchRegex = { $regex: value, $options: 'i' };
                
                orQueries.push({ email: searchRegex });
                orQueries.push({ firstName: searchRegex });
                orQueries.push({ lastName: searchRegex });
            } else {
                query[key] = value;
            }
        }
    }

        query.deletedAt = null;  
        const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
        const users = await this.dataService.user.findAllByAttributeWithFilter(finalQuery, page, limit);
        const totalUsers = await this.dataService.user.count(finalQuery);  // Get total number of users
    
        return { Users: users, totalUsers };
    }
    


    



    async getUserById(id: any): Promise<User> {
        return await this.dataService.user.get(id);
    }

    async createUser(userToCreate: CreateUserDto): Promise<void> {
        const user = this.userFactory.createUser(userToCreate);

        const userExists = await this.dataService.user.findByAttribute(
            "email",
            user.email
        );

        if (userExists && !userExists.deletedAt) { // Vérifier que l'utilisateur n'est pas supprimé
            throw new ConflictException("User already exist.");
        }

        const password = crypto.randomBytes(12).toString('base64url');

        user.password = await this.hashService.hash(password);

        const onBoardedUser = await this.dataService.user.create(user);
    if (userToCreate.role.includes(Role.USER)) {
        this.mailService.onboardingAdminEmail({
            userName: onBoardedUser.firstName,
            userEmail: onBoardedUser.email,
            temporaryPassword: password
        });
    } 
    
    else {

        this.mailService.onboardingEmailUser({
            userName: onBoardedUser.firstName,
            userEmail: onBoardedUser.email,
            temporaryPassword: password
        });

    }
    }

    async updateUser(
        id: string,
        userToUpdate: UpdateUserDto
    ): Promise<User> {
        const user = this.userFactory.updateUser(userToUpdate);
        return this.dataService.user.update(id, user);
    }

    async updateUserRole(
        id: string,
        userToUpdate: UpdateUserRoleDto
    ): Promise<User> {
        const user = this.userFactory.updateRoleUser(userToUpdate);
        return this.dataService.user.update(id, user);
    }

    async findUserByEmail(email: string): Promise<User> {
        const user = await this.dataService.user.findByAttribute("email", email);

        if (!user) throw new NotFoundException("User not found.");
        return user;
    }
    async deleteUser(id: string): Promise<boolean> {
        const user = await this.dataService.user.get(id);
    
        if (!user) throw new NotFoundException("User not found.");
    
  
    
        return await this.dataService.user.delete(id);
    }
    
}
