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
import { SalaryUseCases } from '../../application/useCases';
import { CreateSalaryDto, UpdateSalaryDto } from '../../application/dtos';
import { Salary } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';

@ApiTags('Facturation|Salary')
@Controller('salary')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class SalaryController {
    constructor(private salaryUseCases: SalaryUseCases) {}

    @Post()
    @ApiOperation({ summary: 'Create a salary record' })
    async createSalary(@Body() dto: CreateSalaryDto): Promise<Salary> {
        return this.salaryUseCases.createSalary(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all salaries' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'employeeId', required: false, type: String })
    @ApiQuery({ name: 'month', required: false, type: String })
    async getAllSalaries(@Query() query): Promise<{ salaries: Salary[]; totalSalaries: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const { page: _, limit: __, ...search } = query;

        return this.salaryUseCases.getAllSalaries(page, limit, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get salary by ID' })
    async getSalaryById(@Param('id') id: string): Promise<Salary> {
        return this.salaryUseCases.getSalaryById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update salary' })
    async updateSalary(@Param('id') id: string, @Body() dto: UpdateSalaryDto): Promise<Salary> {
        return this.salaryUseCases.updateSalary(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete salary' })
    async deleteSalary(@Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.salaryUseCases.deleteSalary(id);
        return { success: result };
    }
}
