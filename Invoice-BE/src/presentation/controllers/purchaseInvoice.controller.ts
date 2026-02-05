import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PurchaseInvoiceUseCases } from '../../application/useCases';
import { CreatePurchaseInvoiceDto, UpdatePurchaseInvoiceDto } from '../../application/dtos';
import { PurchaseInvoice } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';

@ApiTags('Facturation|PurchaseInvoice')
@Controller('purchase-invoice')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class PurchaseInvoiceController {
    constructor(private purchaseInvoiceUseCases: PurchaseInvoiceUseCases) { }

    @Post()
    @ApiOperation({ summary: 'Create a new purchase invoice' })
    async createPurchaseInvoice(@Body() dto: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
        return this.purchaseInvoiceUseCases.createPurchaseInvoice(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all purchase invoices' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'isPaid', required: false, type: Boolean })
    @ApiQuery({ name: 'paymentType', required: false, type: String })
    @ApiQuery({ name: 'clientType', required: false, type: String })
    async getAllPurchaseInvoices(@Query() query): Promise<{ purchaseInvoices: PurchaseInvoice[]; total: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const { page: _, limit: __, ...search } = query;

        return await this.purchaseInvoiceUseCases.getAllPurchaseInvoices(page, limit, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get purchase invoice by ID' })
    async getPurchaseInvoiceById(@Param('id') id: string): Promise<PurchaseInvoice> {
        return this.purchaseInvoiceUseCases.getPurchaseInvoiceById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a purchase invoice' })
    async updatePurchaseInvoice(
        @Param('id') id: string,
        @Body() dto: UpdatePurchaseInvoiceDto
    ): Promise<PurchaseInvoice> {
        return this.purchaseInvoiceUseCases.updatePurchaseInvoice(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a purchase invoice' })
    async deletePurchaseInvoice(@Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.purchaseInvoiceUseCases.deletePurchaseInvoice(id);
        return { success: result };
    }
}
