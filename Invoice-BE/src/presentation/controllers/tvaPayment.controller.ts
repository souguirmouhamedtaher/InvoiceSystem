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
import { TvaPaymentUseCases } from '../../application/useCases';
import { CreateTvaPaymentDto, UpdateTvaPaymentDto } from '../../application/dtos';
import { TvaPayment } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { UserDecorator } from '../decorators/getUser.decorator';

@ApiTags('Facturation|TVA')
@Controller('tva-payments')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class TvaPaymentController {
    constructor(private tvaPaymentUseCases: TvaPaymentUseCases) {}

    @Post()
    @ApiOperation({ summary: 'Create a TVA payment' })
    async createPayment(@UserDecorator() user, @Body() dto: CreateTvaPaymentDto): Promise<TvaPayment> {
        return this.tvaPaymentUseCases.createPayment(user, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all TVA payments' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'month', required: false, type: String })
    @ApiQuery({ name: 'companyId', required: false, type: String })
    async getAllPayments(@UserDecorator() user, @Query() query): Promise<{ payments: TvaPayment[]; totalPayments: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const { page: _, limit: __, ...search } = query;

        return this.tvaPaymentUseCases.getAllPayments(user, page, limit, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get TVA payment by ID' })
    async getPaymentById(@UserDecorator() user, @Param('id') id: string): Promise<TvaPayment> {
        return this.tvaPaymentUseCases.getPaymentById(user, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update TVA payment' })
    async updatePayment(@UserDecorator() user, @Param('id') id: string, @Body() dto: UpdateTvaPaymentDto): Promise<TvaPayment> {
        return this.tvaPaymentUseCases.updatePayment(user, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete TVA payment' })
    async deletePayment(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.tvaPaymentUseCases.deletePayment(user, id);
        return { success: result };
    }
}
