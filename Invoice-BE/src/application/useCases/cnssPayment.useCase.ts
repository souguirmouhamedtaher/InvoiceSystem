import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { CnssPayment } from 'src/domain/entities';
import { CreateCnssPaymentDto, UpdateCnssPaymentDto } from '../dtos';

@Injectable()
export class CnssPaymentUseCases {
    constructor(private dataService: IDataServices) {}

    async getAllPayments(
        page: number = 1,
        limit: number = 20,
        search?: { [key: string]: any }
    ): Promise<{ payments: CnssPayment[]; totalPayments: number }> {
        const query: any = { deletedAt: null };

        if (search) {
            if (search.employeeId) {
                query.employeeId = search.employeeId;
            }
            if (search.month) {
                query.month = search.month;
            }
        }

        const payments = await this.dataService.cnssPayment.findAllByAttributeWithFilter(query, page, limit, { createdAt: -1 });
        const totalPayments = await this.dataService.cnssPayment.count(query);

        return { payments: payments || [], totalPayments };
    }

    async getPaymentById(id: string): Promise<CnssPayment> {
        const payment = await this.dataService.cnssPayment.get(id);
        if (!payment) throw new NotFoundException('CNSS payment not found.');
        return payment;
    }

    async createPayment(payload: CreateCnssPaymentDto): Promise<CnssPayment> {
        const employee = await this.dataService.employee.get(payload.employeeId);
        if (!employee) throw new NotFoundException('Employee not found.');
        if (!employee.cnssApplicable) {
            throw new BadRequestException('CNSS is not applicable for this employee.');
        }

        const payment = { ...payload } as any;
        return await this.dataService.cnssPayment.create(payment);
    }

    async updatePayment(id: string, payload: UpdateCnssPaymentDto): Promise<CnssPayment> {
        const existing = await this.dataService.cnssPayment.get(id);
        if (!existing) throw new NotFoundException('CNSS payment not found.');

        return await this.dataService.cnssPayment.update(id, payload as any);
    }

    async deletePayment(id: string): Promise<boolean> {
        const existing = await this.dataService.cnssPayment.get(id);
        if (!existing) throw new NotFoundException('CNSS payment not found.');

        return await this.dataService.cnssPayment.delete(id);
    }
}
