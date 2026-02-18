import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import * as crypto from 'crypto';
import { IDataServices, IHashService, IMailerService } from "../../domain/abstracts";
import {  User } from "../../domain/entities";
import { CreateCompanyUserDto, CreateSuperAdminDto, UpdateSuperAdminDto } from "../dtos";
import { UserFactory } from "../factoryMapper";
import { Role } from "src/domain/enums/role.enums";

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

    async createCompanyUser(
        payload: CreateCompanyUserDto,
        actorId: string
    ): Promise<{ user: User; membershipId: string }> {
        const company = await this.dataServices.company.get(payload.companyId);
        if (!company) throw new NotFoundException('Company not found.');

        const email = payload.email.toLowerCase();
        let user = await this.dataServices.user.findByAttribute('email', email);
        let temporaryPassword: string | null = null;

        if (!user || user.deletedAt) {
            if (!payload.firstName || !payload.lastName) {
                throw new BadRequestException('First name and last name are required for new users.');
            }
            const newUser = new User();
            newUser.firstName = payload.firstName;
            newUser.lastName = payload.lastName;
            newUser.phoneNumber = payload.phone;
            newUser.email = email;
            newUser.role = [Role.USER];
            newUser.createdAt = new Date();
            newUser.updatedAt = new Date();

            if (payload.password && payload.password.trim()) {
                newUser.password = await this.hashServices.hash(payload.password.trim());
            } else {
                temporaryPassword = crypto.randomBytes(12).toString('base64url');
                newUser.password = await this.hashServices.hash(temporaryPassword);
            }

            user = await this.dataServices.user.create(newUser);
        }

        const existingMembership = await this.dataServices.companyMembership.findAllByAttributeWithFilter(
            { 
                $or: [
                    { deletedAt: null },
                    { deletedAt: { $exists: false } }
                ],
                userId: user._id, 
                companyId: company._id 
            },
            1,
            1
        );

        if (existingMembership && existingMembership.length > 0) {
            throw new ConflictException('User is already assigned to this company.');
        }

        const membership = await this.dataServices.companyMembership.create({
            userId: user._id,
            companyId: company._id,
            role: payload.role,
            createdBy: actorId,
        } as any);

        await this.dataServices.auditLog.create({
            userId: actorId,
            companyId: company._id,
            action: 'COMPANY_USER_ASSIGNED',
            entityType: 'company_membership',
            entityId: membership._id,
            metadata: {
                targetUserId: user._id,
                role: payload.role,
                email,
            },
        } as any);

        if (temporaryPassword) {
            this.mailService.onboardingEmailUser({
                userName: user.firstName,
                userEmail: user.email,
                temporaryPassword,
            });
        }

        return { user, membershipId: membership._id.toString() };
    }

    async getCompanyMemberships(
        companyId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ memberships: any[]; total: number }> {
        const filter: any = { 
            $or: [
                { deletedAt: null },
                { deletedAt: { $exists: false } }
            ]
        };
        if (companyId) {
            filter.companyId = companyId;
        }

        const memberships = await this.dataServices.companyMembership.findAllByAttributeWithFilter(
            filter,
            page,
            limit
        );

        const total = memberships ? memberships.length : 0;
        return { memberships: memberships || [], total };
    }

    async deleteCompanyMembership(membershipId: string, actorId: string): Promise<void> {
        const membership = await this.dataServices.companyMembership.get(membershipId);
        if (!membership) throw new NotFoundException('Membership not found.');

        await this.dataServices.auditLog.create({
            userId: actorId,
            companyId: membership.companyId,
            action: 'COMPANY_USER_REMOVED',
            entityType: 'company_membership',
            entityId: membership._id,
            metadata: {
                targetUserId: membership.userId,
                role: membership.role,
            },
        } as any);

        await this.dataServices.companyMembership.delete(membershipId);
    }

    async getAuditLogs(
        companyId?: string,
        userId?: string,
        action?: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ logs: any[]; total: number }> {
        const filter: any = { deletedAt: null };
        if (companyId) filter.companyId = companyId;
        if (userId) filter.userId = userId;
        if (action) filter.action = action;

        const logs = await this.dataServices.auditLog.findAllByAttributeWithFilter(
            filter,
            page,
            limit
        );

        const total = logs ? logs.length : 0;
        return { logs: logs || [], total };
    }

}
