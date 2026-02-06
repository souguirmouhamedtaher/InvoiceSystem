import { Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { TvaPayment } from 'src/domain/entities';
import { CreateTvaPaymentDto, UpdateTvaPaymentDto } from '../dtos';

@Injectable()
export class TvaPaymentUseCases {
    constructor(private dataService: IDataServices) {}

    async getAllPayments(
        page: number = 1,
        limit: number = 20,
        search?: { [key: string]: any }
    ): Promise<{ payments: TvaPayment[]; totalPayments: number }> {
        const query: any = { deletedAt: null };

        if (search) {
            if (search.month) {
                query.month = search.month;
            }
        }

        const payments = await this.dataService.tvaPayment.findAllByAttributeWithFilter(query, page, limit, { createdAt: -1 });
        const totalPayments = await this.dataService.tvaPayment.count(query);

        return { payments: payments || [], totalPayments };
    }

    async getPaymentById(id: string): Promise<TvaPayment> {
        const payment = await this.dataService.tvaPayment.get(id);
        if (!payment) throw new NotFoundException('TVA payment not found.');
        return payment;
    }

    async createPayment(payload: CreateTvaPaymentDto): Promise<TvaPayment> {
        const payment = { ...payload } as TvaPayment;
        return await this.dataService.tvaPayment.create(payment);
    }

    async updatePayment(id: string, payload: UpdateTvaPaymentDto): Promise<TvaPayment> {
        const existing = await this.dataService.tvaPayment.get(id);
        if (!existing) throw new NotFoundException('TVA payment not found.');

        return await this.dataService.tvaPayment.update(id, payload as any);
    }

    async deletePayment(id: string): Promise<boolean> {
        const existing = await this.dataService.tvaPayment.get(id);
        if (!existing) throw new NotFoundException('TVA payment not found.');

        return await this.dataService.tvaPayment.delete(id);
    }
}
