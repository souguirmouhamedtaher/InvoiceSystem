import { Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { PurchaseInvoice } from 'src/domain/entities';
import { CreatePurchaseInvoiceDto, UpdatePurchaseInvoiceDto } from '../dtos';

@Injectable()
export class PurchaseInvoiceUseCases {
    constructor(private dataService: IDataServices) { }

    async getAllPurchaseInvoices(
        page: number = 1,
        limit: number = 20,
        search?: { [key: string]: any }
    ): Promise<{ purchaseInvoices: PurchaseInvoice[]; total: number }> {
        const query: any = { deletedAt: null };

        if (search) {
            if (search.search) {
                query.invoiceName = { $regex: search.search, $options: 'i' };
            }
            if (search.isPaid !== undefined) {
                query.isPaid = search.isPaid === 'true' || search.isPaid === true;
            }
            if (search.paymentType) {
                query.paymentType = search.paymentType;
            }
            if (search.clientType) {
                query.clientType = search.clientType;
            }
        }

        const purchaseInvoices = await this.dataService.purchaseInvoice.findAllByAttributeWithFilter(
            query,
            page,
            limit,
            { createdAt: -1 }
        );
        const total = await this.dataService.purchaseInvoice.count(query);

        return { purchaseInvoices: purchaseInvoices || [], total };
    }

    async getPurchaseInvoiceById(id: string): Promise<PurchaseInvoice> {
        const invoice = await this.dataService.purchaseInvoice.get(id);
        if (!invoice) throw new NotFoundException('Purchase invoice not found.');
        return invoice;
    }

    async createPurchaseInvoice(dto: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
            const company = await this.dataService.company.get(dto.companyId);
            if (!company) throw new NotFoundException('Company not found.');

            const supplier = await this.dataService.supplier.get(dto.supplierId);
            if (!supplier) throw new NotFoundException('Supplier not found.');
            const supplierCompanyId = (supplier as any).companyId?._id ?? (supplier as any).companyId;
            if (String(supplierCompanyId) !== String(dto.companyId)) {
                throw new NotFoundException('Supplier does not belong to this company.');
            }

            const purchaseInvoice = {
                ...dto,
                companyId: dto.companyId as any,
                supplierId: dto.supplierId as any,
            } as any;

        return await this.dataService.purchaseInvoice.create(purchaseInvoice);
    }

    async updatePurchaseInvoice(id: string, dto: UpdatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
        const existing = await this.dataService.purchaseInvoice.get(id);
        if (!existing) throw new NotFoundException('Purchase invoice not found.');

        return await this.dataService.purchaseInvoice.update(id, dto as any);
    }

    async deletePurchaseInvoice(id: string): Promise<boolean> {
        const existing = await this.dataService.purchaseInvoice.get(id);
        if (!existing) throw new NotFoundException('Purchase invoice not found.');

        return await this.dataService.purchaseInvoice.delete(id);
    }
}
