import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Res,
    UseGuards,
    UsePipes,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EmployeeUseCases } from '../../application/useCases';
import { CreateEmployeeDto, GeneratePayrollDto, ImportEmployeeCsvDto, UpdateEmployeeDto } from '../../application/dtos';
import { Employee } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { UserDecorator } from '../decorators/getUser.decorator';
import { Response } from 'express';

@ApiTags('Facturation|Employee')
@Controller('employee')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class EmployeeController {
    constructor(private employeeUseCases: EmployeeUseCases) {}

    @Post()
    @ApiOperation({ summary: 'Create a new employee' })
    async createEmployee(@UserDecorator() user, @Body() dto: CreateEmployeeDto): Promise<Employee> {
        return this.employeeUseCases.createEmployee(user, dto);
    }

    @Get('payroll/summary')
    @ApiOperation({ summary: 'Get monthly payroll summary (CNSS and salary totals)' })
    @ApiQuery({ name: 'month', required: true, type: String, description: 'Month in YYYY-MM format' })
    @ApiQuery({ name: 'companyId', required: false, type: String })
    async getMonthlyPayrollSummary(@UserDecorator() user, @Query() query) {
        return this.employeeUseCases.getMonthlyPayrollSummary(user, query.month, query.companyId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all employees' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getAllEmployees(@UserDecorator() user, @Query() query): Promise<{ employees: Employee[]; totalEmployees: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const { page: _, limit: __, ...search } = query;

        return this.employeeUseCases.getAllEmployees(user, page, limit, search);
    }

    @Get('my-memberships')
    @ApiOperation({ summary: 'Get current user company memberships (owned from companies + invited from company_memberships)' })
    async getUserMemberships(@UserDecorator() user): Promise<{ memberships: any[] }> {
        const raw = user?._id ?? user?.id ?? user?.sub;
        const userId = raw?.toString?.() ?? (raw != null ? String(raw) : '');
        console.log('[my-memberships] Controller: raw=', raw, 'userId=', userId);
        if (!userId || userId === 'undefined') {
            console.log('[my-memberships] Controller: returning empty (no userId)');
            return { memberships: [] };
        }
        return this.employeeUseCases.getUserMemberships(userId);
    }

    @Get('export-csv')
    @ApiOperation({ summary: 'Export employees to CSV (owner or manager)' })
    async exportEmployeesCsv(
        @UserDecorator() user,
        @Query('companyId') companyId: string,
        @Res() res: Response
    ) {
        const csv = await this.employeeUseCases.exportEmployeesCsv(user, companyId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="employees-${companyId}.csv"`);
        res.end(csv);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get employee by ID' })
    async getEmployeeById(@UserDecorator() user, @Param('id') id: string): Promise<Employee> {
        return this.employeeUseCases.getEmployeeById(user, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update employee' })
    async updateEmployee(
        @UserDecorator() user,
        @Param('id') id: string,
        @Body() dto: UpdateEmployeeDto
    ): Promise<Employee> {
        return this.employeeUseCases.updateEmployee(user, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete employee' })
    async deleteEmployee(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.employeeUseCases.deleteEmployee(user, id);
        return { success: result };
    }

    @Post('generate-monthly')
    @ApiOperation({ summary: 'Generate monthly salaries and CNSS payments' })
    async generateMonthlyPayroll(@UserDecorator() user, @Body() dto: GeneratePayrollDto) {
        return this.employeeUseCases.generateMonthlyPayroll(user, dto.month, dto.companyId);
    }

    @Post('import-csv')
    @ApiOperation({ summary: 'Import employees from CSV (manager only)' })
    async importEmployeesFromCsv(@UserDecorator() user, @Body() dto: ImportEmployeeCsvDto) {
        return this.employeeUseCases.importEmployeesFromCsv(user, dto);
    }
}
