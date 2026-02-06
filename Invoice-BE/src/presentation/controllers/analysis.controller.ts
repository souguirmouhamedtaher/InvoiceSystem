import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnalysisUseCases } from '../../application/useCases';
import { AccessTokenGuard } from '../guards/accessToken.guard';

@ApiTags('Facturation|Analysis')
@Controller('analysis')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class AnalysisController {
    constructor(private readonly analysisUseCases: AnalysisUseCases) { }

    @Get('treasury')
    @ApiOperation({
        summary: 'Get treasury and VAT analysis',
        description: 'Calculates sales vs purchases statistics, VAT carry-forward, and net VAT to pay.'
    })
    @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by year (e.g. 2025)' })
    @ApiQuery({ name: 'month', required: false, type: Number, description: 'Filter by month (1-12)' })
    async getTreasuryAnalysis(
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        const y = year ? parseInt(year, 10) : undefined;
        const m = month ? parseInt(month, 10) : undefined;
        return this.analysisUseCases.getTreasuryAnalysis(y, m);
    }

    @Get('vat-cumulative')
    @ApiOperation({
        summary: 'Get cumulative VAT balance',
        description: 'Calculates the running VAT balance month by month.'
    })
    @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by year (e.g. 2025)' })
    @ApiQuery({ name: 'month', required: false, type: Number, description: 'Filter by month (1-12)' })
    async getVatCumulative(
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        const y = year ? parseInt(year, 10) : undefined;
        const m = month ? parseInt(month, 10) : undefined;
        return this.analysisUseCases.getVatCumulative(y, m);
    }

    @Get('cash-dashboard')
    @ApiOperation({
        summary: 'Get cash dashboard totals',
        description: 'Aggregates sales, purchases, VAT, salaries, CNSS, and cash balance by month.'
    })
    @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by year (e.g. 2025)' })
    @ApiQuery({ name: 'month', required: false, type: Number, description: 'Filter by month (1-12)' })
    async getCashDashboard(
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        const y = year ? parseInt(year, 10) : undefined;
        const m = month ? parseInt(month, 10) : undefined;
        return this.analysisUseCases.getCashDashboard(y, m);
    }
}
