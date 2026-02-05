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
    UsePipes,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CnssPaymentUseCases } from '../../application/useCases';
import { CreateCnssPaymentDto, UpdateCnssPaymentDto } from '../../application/dtos';
import { CnssPayment } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';

@ApiTags('Facturation|CNSS')
@Controller('cnss')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class CnssPaymentController {
    constructor(private cnssPaymentUseCases: CnssPaymentUseCases) {}

    @Post()
    @ApiOperation({ summary: 'Create a CNSS payment' })
    async createPayment(@Body() dto: CreateCnssPaymentDto): Promise<CnssPayment> {
        return this.cnssPaymentUseCases.createPayment(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all CNSS payments' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'employeeId', required: false, type: String })
    @ApiQuery({ name: 'month', required: false, type: String })
    async getAllPayments(@Query() query): Promise<{ payments: CnssPayment[]; totalPayments: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const { page: _, limit: __, ...search } = query;

        return this.cnssPaymentUseCases.getAllPayments(page, limit, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get CNSS payment by ID' })
    async getPaymentById(@Param('id') id: string): Promise<CnssPayment> {
        return this.cnssPaymentUseCases.getPaymentById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update CNSS payment' })
    async updatePayment(@Param('id') id: string, @Body() dto: UpdateCnssPaymentDto): Promise<CnssPayment> {
        return this.cnssPaymentUseCases.updatePayment(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete CNSS payment' })
    async deletePayment(@Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.cnssPaymentUseCases.deletePayment(id);
        return { success: result };
    }
}
