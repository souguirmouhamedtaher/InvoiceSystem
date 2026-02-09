import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    Res,
    InternalServerErrorException
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvoiceUseCases } from '../../application/useCases';
import { AddInvoicePaymentDto, CreateInvoiceDto, UpdateInvoiceDto } from '../../application/dtos';
import { Invoice } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { UserDecorator } from '../decorators/getUser.decorator';
import { Response } from 'express';

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
    async calculateInvoice(@UserDecorator() user, @Body() createInvoiceDto: CreateInvoiceDto) {
        return this.invoiceUseCases.calculateInvoice(user, createInvoiceDto);
    }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create a new invoice with automatic calculations',
        description: 'Automatically generates invoice number (YYYY-NNNN format), calculates totals from libelles. Libelle IDs must be provided.'
    })
    async createInvoice(@UserDecorator() user, @Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
        return this.invoiceUseCases.createInvoice(user, createInvoiceDto);
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
    @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Filter by mycompanyId' })
    async getAllInvoices(@UserDecorator() user, @Query() query): Promise<{ invoices: Invoice[]; totalInvoices: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;

        const { page: _, limit: __, ...search } = query;

        return await this.invoiceUseCases.getAllInvoices(user, page, limit, search);
    }

    @Get('stats')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoice statistics (total count, total amount, count by status)' })
    @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Filter by mycompanyId' })
    async getInvoiceStats(@UserDecorator() user, @Query('companyId') companyId?: string): Promise<{
        totalInvoices: number;
        totalAmount: number;
        byStatus: { [key: string]: number };
    }> {
        return this.invoiceUseCases.getInvoiceStats(user, companyId);
    }

    @Get('date-range')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoices by date range' })
    @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Filter by mycompanyId' })
    async getInvoicesByDateRange(
        @UserDecorator() user,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('companyId') companyId?: string
    ): Promise<Invoice[]> {
        return this.invoiceUseCases.getInvoicesByDateRange(user, startDate, endDate, companyId);
    }

    @Get(':id')
    @ApiBearerAuth()
    async getInvoiceById(@UserDecorator() user, @Param('id') id: string): Promise<Invoice> {
        return this.invoiceUseCases.getInvoiceById(user, id);
    }

    @Get(':id/pdf')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download invoice PDF' })
    async downloadInvoicePdf(@UserDecorator() user, @Param('id') id: string, @Res() res: Response) {
        try {
            const buffer = await this.invoiceUseCases.generateInvoicePdf(user, id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="facture-${id}.pdf"`);
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.end(buffer);
        } catch (error) {
            console.error('Invoice PDF error:', error);
            throw new InternalServerErrorException('Impossible de generer le PDF.');
        }
    }

    @Get(':id/xml')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download invoice XML (Tunisian Elfatoora TEIF v1.8.8 format)' })
    async downloadInvoiceXml(@UserDecorator() user, @Param('id') id: string, @Res() res: Response) {
        try {
            const buffer = await this.invoiceUseCases.generateInvoiceXml(user, id);
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', `attachment; filename="facture-${id}.xml"`);
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.end(buffer);
        } catch (error) {
            console.error('Invoice XML error:', error);
            throw new InternalServerErrorException('Impossible de generer le XML.');
        }
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update an invoice with automatic total recalculation',
        description: 'If libelles are updated, totals will be automatically recalculated.'
    })
    async updateInvoice(
        @UserDecorator() user,
        @Param('id') id: string,
        @Body() updateInvoiceDto: UpdateInvoiceDto
    ): Promise<Invoice> {
        return this.invoiceUseCases.updateInvoice(user, id, updateInvoiceDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteInvoice(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.invoiceUseCases.deleteInvoice(user, id);
        return { success: result };
    }

    @Post(':id/payments')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a payment to an invoice' })
    async addInvoicePayment(
        @UserDecorator() user,
        @Param('id') id: string,
        @Body() payload: AddInvoicePaymentDto
    ): Promise<Invoice> {
        return this.invoiceUseCases.addInvoicePayment(user, id, payload);
    }
}
