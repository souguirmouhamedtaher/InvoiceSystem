import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import * as crypto from 'crypto';
import { IDataServices, IHashService, IMailerService } from "../../domain/abstracts";
import {  User } from "../../domain/entities";
import { AssignUserToCompanyDto, CreateSuperAdminDto, UpdateSuperAdminDto } from "../dtos";
import { UserFactory } from "../factoryMapper";
import { Role } from "src/domain/enums/role.enums";
import { companyType } from "src/domain/enums/company.enums";

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

    async assignUserToCompany(
        dto: AssignUserToCompanyDto,
        actorId: string
    ): Promise<any> {
        // Verify user exists
        const user = await this.dataServices.user.get(dto.userId);
        if (!user) throw new NotFoundException('User not found.');

        // Verify company exists
        const company = await this.dataServices.company.get(dto.companyId);
        if (!company) throw new NotFoundException('Company not found.');

        // Check if membership already exists
        const existingMembership = await this.dataServices.companyMembership.findAllByAttributeWithFilter(
            {
                userId: dto.userId,
                companyId: dto.companyId,
                $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
            },
            1,
            1
        );

        if (existingMembership && existingMembership.length > 0) {
            throw new ConflictException('User is already assigned to this company.');
        }

        // Create membership
        const membership = await this.dataServices.companyMembership.create({
            userId: dto.userId,
            companyId: dto.companyId,
            role: dto.role,
            createdBy: actorId,
            createdAt: new Date(),
        } as any);

        // Log the action
        await this.dataServices.auditLog.create({
            userId: actorId,
            companyId: dto.companyId,
            action: 'COMPANY_USER_ASSIGNED',
            entityType: 'company_membership',
            entityId: membership._id,
            metadata: {
                targetUserId: dto.userId,
                role: dto.role,
            },
        } as any);

        return membership;
    }

    async createCompanyUser(
        payload: { email: string; password: string; firstName: string; lastName: string; phone?: string; companyId: string; role: string },
        actorId: string
    ): Promise<any> {
        // Check if user already exists
        const existingUser = await this.dataServices.user.findByAttribute('email', payload.email);
        
        let userId: string;
        
        if (existingUser && !existingUser.deletedAt) {
            // User exists, just assign to company
            userId = existingUser._id;
        } else {
            // Create new user
            const hashedPassword = await this.hashServices.hash(payload.password);
            const newUser = await this.dataServices.user.create({
                email: payload.email,
                password: hashedPassword,
                firstName: payload.firstName,
                lastName: payload.lastName,
                phone: payload.phone,
                roles: [Role.USER],
                createdAt: new Date(),
            } as any);
            userId = newUser._id;
        }

        // Verify company exists
        const company = await this.dataServices.company.get(payload.companyId);
        if (!company) throw new NotFoundException('Company not found.');

        // Check if membership already exists
        const existingMembership = await this.dataServices.companyMembership.findAllByAttributeWithFilter(
            {
                userId: userId,
                companyId: payload.companyId,
                $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
            },
            1,
            1
        );

        if (existingMembership && existingMembership.length > 0) {
            throw new ConflictException('User is already assigned to this company.');
        }

        // Create membership
        const membership = await this.dataServices.companyMembership.create({
            userId: userId,
            companyId: payload.companyId,
            role: payload.role,
            createdBy: actorId,
            createdAt: new Date(),
        } as any);

        // Log the action
        await this.dataServices.auditLog.create({
            userId: actorId,
            companyId: payload.companyId,
            action: 'COMPANY_USER_ASSIGNED',
            entityType: 'company_membership',
            entityId: membership._id,
            metadata: {
                targetUserId: userId,
                role: payload.role,
                userCreated: !existingUser,
            },
        } as any);

        return membership;
    }

}
