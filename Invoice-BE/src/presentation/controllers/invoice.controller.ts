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
import { InvoiceUseCases } from '../../application/useCases';
import { AddInvoicePaymentDto, CreateInvoiceDto, UpdateInvoiceDto } from '../../application/dtos';
import { Invoice } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';

@ApiTags('Facturation|Invoice')
@Controller('invoice')
@UseGuards(AccessTokenGuard)
export class InvoiceController {
    constructor(private invoiceUseCases: InvoiceUseCases) { }

    @Post('calculate')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Calculate invoice totals without creating',
        description: 'Calculates totals, taxes, and final amounts based on provided libelles and settings. Does not save to database.'
    })
    async calculateInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.invoiceUseCases.calculateInvoice(createInvoiceDto);
    }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create a new invoice with automatic calculations',
        description: 'Automatically generates invoice number (YYYY-NNNN format), calculates totals from libelles. Libelle IDs must be provided.'
    })
    async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
        return this.invoiceUseCases.createInvoice(createInvoiceDto);
    }

    @Get()
    @ApiBearerAuth()
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in username, invoice number, application name' })
    @ApiQuery({ name: 'clientType', required: false, type: String, description: 'Filter by client type' })
    @ApiQuery({ name: 'invoiceType', required: false, type: String, description: 'Filter by invoice type (selling/buying)' })
    @ApiQuery({ name: 'invoiceStatus', required: false, type: String, description: 'Filter by invoice status' })
    @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Filter by start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Filter by end date (YYYY-MM-DD)' })
    async getAllInvoices(@Query() query): Promise<{ invoices: Invoice[]; totalInvoices: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;

        const { page: _, limit: __, ...search } = query;

        return await this.invoiceUseCases.getAllInvoices(page, limit, search);
    }

    @Get('stats')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoice statistics (total count, total amount, count by status)' })
    async getInvoiceStats(): Promise<{
        totalInvoices: number;
        totalAmount: number;
        byStatus: { [key: string]: number };
    }> {
        return this.invoiceUseCases.getInvoiceStats();
    }

    @Get('date-range')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoices by date range' })
    @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' })
    async getInvoicesByDateRange(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ): Promise<Invoice[]> {
        return this.invoiceUseCases.getInvoicesByDateRange(startDate, endDate);
    }

    @Get(':id')
    @ApiBearerAuth()
    async getInvoiceById(@Param('id') id: string): Promise<Invoice> {
        return this.invoiceUseCases.getInvoiceById(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update an invoice with automatic total recalculation',
        description: 'If libelles are updated, totals will be automatically recalculated.'
    })
    async updateInvoice(
        @Param('id') id: string,
        @Body() updateInvoiceDto: UpdateInvoiceDto
    ): Promise<Invoice> {
        return this.invoiceUseCases.updateInvoice(id, updateInvoiceDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteInvoice(@Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.invoiceUseCases.deleteInvoice(id);
        return { success: result };
    }

    @Post(':id/payments')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a payment to an invoice' })
    async addInvoicePayment(
        @Param('id') id: string,
        @Body() payload: AddInvoicePaymentDto
    ): Promise<Invoice> {
        return this.invoiceUseCases.addInvoicePayment(id, payload);
    }
}
