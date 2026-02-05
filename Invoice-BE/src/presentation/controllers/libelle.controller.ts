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
import { LibelleUseCases } from '../../application/useCases';
import { CreateLibelleDto, UpdateLibelleDto } from '../../application/dtos';
import { Libelle } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { LibelleFactory } from '../../application/factoryMapper';

@ApiTags('Facturation|Libelle')
@Controller('libelle')
@UseGuards(AccessTokenGuard)
export class LibelleController {
    constructor(
        private libelleUseCases: LibelleUseCases,
        private libelleFactory: LibelleFactory
    ) {}

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new libelle with automatic price calculations' })
    async createLibelle(@Body() createLibelleDto: CreateLibelleDto): Promise<Libelle> {
        return this.libelleUseCases.createLibelle(createLibelleDto);
    }

    @Post('calculate')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Calculate libelle prices WITHOUT creating it', 
        description: 'Use this endpoint to preview price calculations (prixTTC, finalprixHT, finalprixTTC) before creating the libelle. Returns calculated values only.'
    })
    async calculateLibellePrices(@Body() createLibelleDto: CreateLibelleDto): Promise<{
        name: string;
        qte: number;
        prixHT: string;
        prixTTC: string;
        finalprixHT: string;
        finalprixTTC: string;
        discount: {
            type: string;
            amount: number;
            percentage: number;
        };
        tax: {
            taxprice: number;
            taxAmount: string;
        };
    }> {
        // Get tax settings to calculate prices
        let taxprice = 0;
        let taxSettings = null;
        if (createLibelleDto.TexSettingsId) {
            taxSettings = await this.libelleUseCases['dataService'].TaxSettings.get(createLibelleDto.TexSettingsId);
            if (taxSettings) {
                taxprice = taxSettings.taxprice;
            }
        }

        // Use factory to calculate (without saving)
        const calculatedLibelle = this.libelleFactory.createLibelle(createLibelleDto, taxprice);

        // Calculate tax amount
        const finalprixHT = parseFloat(calculatedLibelle.finalprixHT || '0');
        const taxAmount = ((finalprixHT * taxprice) / 100).toFixed(2);

        return {
            name: calculatedLibelle.name,
            qte: calculatedLibelle.qte,
            prixHT: calculatedLibelle.prixHT,
            prixTTC: calculatedLibelle.prixTTC,
            finalprixHT: calculatedLibelle.finalprixHT,
            finalprixTTC: calculatedLibelle.finalprixTTC,
            discount: {
                type: calculatedLibelle.discountType || 'none',
                amount: calculatedLibelle.amount_discount || 0,
                percentage: calculatedLibelle.percentage_discount || 0
            },
            tax: {
                taxprice: taxprice,
                taxAmount: taxAmount
            }
        };
    }

    @Get()
    @ApiBearerAuth()
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in libelle name, description' })
    @ApiQuery({ name: 'productType', required: false, type: String, description: 'Filter by product type (product/service)' })
    @ApiQuery({ name: 'unity', required: false, type: String, description: 'Filter by unity (kg/hours/day/article)' })
    async getAllLibelles(@Query() query): Promise<{ libelles: Libelle[]; totalLibelles: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;

        const { page: _, limit: __, ...search } = query;

        return await this.libelleUseCases.getAllLibelles(page, limit, search);
    }

    @Get(':id')
    @ApiBearerAuth()
    async getLibelleById(@Param('id') id: string): Promise<Libelle> {
        return this.libelleUseCases.getLibelleById(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a libelle with automatic price recalculation' })
    async updateLibelle(
        @Param('id') id: string,
        @Body() updateLibelleDto: UpdateLibelleDto
    ): Promise<Libelle> {
        return this.libelleUseCases.updateLibelle(id, updateLibelleDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteLibelle(@Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.libelleUseCases.deleteLibelle(id);
        return { success: result };
    }
}
