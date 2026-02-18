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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TaxSettingsUseCases } from '../../application/useCases';
import { CreateTaxSettingsDto, UpdateTaxSettingsDto } from '../../application/dtos';
import { TaxSettings } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { UserDecorator } from '../decorators/getUser.decorator';

@ApiTags('Facturation|TaxSettings')
@Controller('tax-settings')
@UseGuards(AccessTokenGuard)
export class TaxSettingsController {
    constructor(private taxSettingsUseCases: TaxSettingsUseCases) {}

    @Post()
    @ApiBearerAuth()
    async createTaxSettings(@UserDecorator() user, @Body() createTaxSettingsDto: CreateTaxSettingsDto): Promise<TaxSettings> {
        return this.taxSettingsUseCases.createTaxSettings(user, createTaxSettingsDto);
    }

    @Get()
    @ApiBearerAuth()
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'companyId', required: true, type: String })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in tax name' })
    @ApiQuery({ name: 'isactive', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'taxType', required: false, type: String, description: 'Filter by tax type' })
    async getAllTaxSettings(@UserDecorator() user, @Query() query): Promise<{ taxSettings: TaxSettings[]; totalTaxSettings: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;

        const { page: _, limit: __, ...search } = query;

        return await this.taxSettingsUseCases.getAllTaxSettings(user, page, limit, search);
    }

    @Get('active')
    @ApiBearerAuth()
    @ApiQuery({ name: 'companyId', required: true, type: String })
    async getActiveTaxSettings(@UserDecorator() user, @Query() query): Promise<TaxSettings[]> {
        return this.taxSettingsUseCases.getActiveTaxSettings(user, query.companyId);
    }

    @Get(':id')
    @ApiBearerAuth()
    async getTaxSettingsById(@UserDecorator() user, @Param('id') id: string): Promise<TaxSettings> {
        return this.taxSettingsUseCases.getTaxSettingsById(user, id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    async updateTaxSettings(
        @UserDecorator() user,
        @Param('id') id: string,
        @Body() updateTaxSettingsDto: UpdateTaxSettingsDto
    ): Promise<TaxSettings> {
        return this.taxSettingsUseCases.updateTaxSettings(user, id, updateTaxSettingsDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteTaxSettings(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.taxSettingsUseCases.deleteTaxSettings(user, id);
        return { success: result };
    }
}
