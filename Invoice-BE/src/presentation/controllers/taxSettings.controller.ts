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

@ApiTags('Facturation|TaxSettings')
@Controller('tax-settings')
@UseGuards(AccessTokenGuard)
export class TaxSettingsController {
    constructor(private taxSettingsUseCases: TaxSettingsUseCases) {}

    @Post()
    @ApiBearerAuth()
    async createTaxSettings(@Body() createTaxSettingsDto: CreateTaxSettingsDto): Promise<TaxSettings> {
        return this.taxSettingsUseCases.createTaxSettings(createTaxSettingsDto);
    }

    @Get()
    @ApiBearerAuth()
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in tax name' })
    @ApiQuery({ name: 'isactive', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'taxType', required: false, type: String, description: 'Filter by tax type' })
    async getAllTaxSettings(@Query() query): Promise<{ taxSettings: TaxSettings[]; totalTaxSettings: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;

        const { page: _, limit: __, ...search } = query;

        return await this.taxSettingsUseCases.getAllTaxSettings(page, limit, search);
    }

    @Get('active')
    @ApiBearerAuth()
    async getActiveTaxSettings(): Promise<TaxSettings[]> {
        return this.taxSettingsUseCases.getActiveTaxSettings();
    }

    @Get(':id')
    @ApiBearerAuth()
    async getTaxSettingsById(@Param('id') id: string): Promise<TaxSettings> {
        return this.taxSettingsUseCases.getTaxSettingsById(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    async updateTaxSettings(
        @Param('id') id: string,
        @Body() updateTaxSettingsDto: UpdateTaxSettingsDto
    ): Promise<TaxSettings> {
        return this.taxSettingsUseCases.updateTaxSettings(id, updateTaxSettingsDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteTaxSettings(@Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.taxSettingsUseCases.deleteTaxSettings(id);
        return { success: result };
    }
}
