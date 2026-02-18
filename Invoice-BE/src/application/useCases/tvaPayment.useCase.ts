import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { TvaPayment } from 'src/domain/entities';
import { CreateTvaPaymentDto, UpdateTvaPaymentDto } from '../dtos';
import { Types } from 'mongoose';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';
import { Role } from 'src/domain/enums/role.enums';

type RequestUser = {
    _id: string;
    roles?: string[];
};

@Injectable()
export class TvaPaymentUseCases {
    constructor(private dataService: IDataServices) {}

    async getAllPayments(
        user: RequestUser,
        page: number = 1,
        limit: number = 20,
        search?: { [key: string]: any }
    ): Promise<{ payments: TvaPayment[]; totalPayments: number }> {
        const query: any = { deletedAt: null };

        if (search?.month) {
            query.month = search.month;
        }

        if (search?.companyId) {
            query.companyId = new Types.ObjectId(search.companyId);
        }

        if (!this.isAdmin(user.roles)) {
            if (!search?.companyId) {
                throw new BadRequestException('companyId is required.');
            }
            await this.assertCompanyAccess(user._id, search.companyId);
        }

        const payments = await this.dataService.tvaPayment.findAllByAttributeWithFilter(query, page, limit, { createdAt: -1 });
        const totalPayments = await this.dataService.tvaPayment.count(query);

        return { payments: payments || [], totalPayments };
    }

    async getPaymentById(user: RequestUser, id: string): Promise<TvaPayment> {
        const payment = await this.dataService.tvaPayment.get(id);
        if (!payment) throw new NotFoundException('TVA payment not found.');

        if (!this.isAdmin(user.roles)) {
            const companyId = (payment as any).companyId?._id ?? (payment as any).companyId;
            if (!companyId) throw new ForbiddenException('Access denied.');
            await this.assertCompanyAccess(user._id, companyId.toString());
        }

        return payment;
    }

    async createPayment(user: RequestUser, payload: CreateTvaPaymentDto): Promise<TvaPayment> {
        if (!payload.companyId) {
            throw new BadRequestException('companyId is required.');
        }

        if (!this.isAdmin(user.roles)) {
            await this.assertCompanyAccess(user._id, payload.companyId);
        }

        const payment: Partial<TvaPayment> = {
            ...payload,
            userId: new Types.ObjectId(user._id) as any,
            companyId: new Types.ObjectId(payload.companyId) as any,
        };

        return await this.dataService.tvaPayment.create(payment as TvaPayment);
    }

    async updatePayment(user: RequestUser, id: string, payload: UpdateTvaPaymentDto): Promise<TvaPayment> {
        const existing = await this.dataService.tvaPayment.get(id);
        if (!existing) throw new NotFoundException('TVA payment not found.');

        const companyId = (existing as any).companyId?._id ?? (existing as any).companyId;
        if (!companyId) throw new ForbiddenException('Access denied.');

        if (!this.isAdmin(user.roles)) {
            await this.assertCompanyAccess(user._id, companyId.toString());
        }

        if ((payload as any).companyId && String((payload as any).companyId) !== String(companyId)) {
            throw new BadRequestException('companyId cannot be changed.');
        }

        return await this.dataService.tvaPayment.update(id, payload as any);
    }

    async deletePayment(user: RequestUser, id: string): Promise<boolean> {
        const existing = await this.dataService.tvaPayment.get(id);
        if (!existing) throw new NotFoundException('TVA payment not found.');

        const companyId = (existing as any).companyId?._id ?? (existing as any).companyId;
        if (!companyId) throw new ForbiddenException('Access denied.');

        if (!this.isAdmin(user.roles)) {
            await this.assertCompanyAccess(user._id, companyId.toString());
        }

        return await this.dataService.tvaPayment.delete(id);
    }

    private isAdmin(roles?: string[]): boolean {
        return roles?.includes(Role.SUPERADMIN) ?? false;
    }

    private async assertCompanyAccess(userId: string, companyId: string): Promise<void> {
        const owned = await this.dataService.company.findAllByAttributeWithFilter(
            { _id: new Types.ObjectId(companyId), userId: new Types.ObjectId(userId) },
            1,
            1
        );
        if (owned?.length) return;

        const membership = await this.dataService.companyMembership.findAllByAttributeWithFilter(
            {
                deletedAt: null,
                userId: new Types.ObjectId(userId),
                companyId: new Types.ObjectId(companyId),
            },
            1,
            1
        );

        if (!membership?.length) {
            throw new ForbiddenException('Access denied.');
        }

        const role = (membership[0].role as string)?.toLowerCase?.() ?? membership[0].role;
        if (role !== CompanyRole.ACCOUNTANT) {
            throw new ForbiddenException('Insufficient role for this action.');
        }
    }
}
