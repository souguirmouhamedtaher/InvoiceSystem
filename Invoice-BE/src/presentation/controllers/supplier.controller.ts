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
import { SupplierUseCases } from '../../application/useCases';
import { CreateSupplierDto, UpdateSupplierDto } from '../../application/dtos';
import { Supplier } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { UserDecorator } from '../decorators/getUser.decorator';

@ApiTags('Facturation|Suppliers')
@Controller('suppliers')
@UseGuards(AccessTokenGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class SupplierController {
    constructor(private supplierUseCases: SupplierUseCases) {}

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a supplier' })
    async createSupplier(@UserDecorator() user, @Body() dto: CreateSupplierDto): Promise<Supplier> {
        return this.supplierUseCases.createSupplier(user, dto);
    }

    @Get()
    @ApiBearerAuth()
    @ApiQuery({ name: 'companyId', required: true, type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getAllSuppliers(@UserDecorator() user, @Query() query): Promise<{ suppliers: Supplier[]; totalSuppliers: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const companyId = query.companyId;
        const { page: _, limit: __, companyId: ___, ...search } = query;
        return this.supplierUseCases.getAllSuppliers(user, companyId, page, limit, search);
    }

    @Get(':id')
    @ApiBearerAuth()
    async getSupplierById(@UserDecorator() user, @Param('id') id: string): Promise<Supplier> {
        return this.supplierUseCases.getSupplierById(user, id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    async updateSupplier(@UserDecorator() user, @Param('id') id: string, @Body() dto: UpdateSupplierDto): Promise<Supplier> {
        return this.supplierUseCases.updateSupplier(user, id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteSupplier(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.supplierUseCases.deleteSupplier(user, id);
        return { success: result };
    }
}
