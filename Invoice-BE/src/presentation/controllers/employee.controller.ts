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
import { EmployeeUseCases } from '../../application/useCases';
import { CreateEmployeeDto, GeneratePayrollDto, UpdateEmployeeDto } from '../../application/dtos';
import { Employee } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { UserDecorator } from '../decorators/getUser.decorator';

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
        return this.employeeUseCases.createEmployee(user._id, dto);
    }

    @Get('payroll/summary')
    @ApiOperation({ summary: 'Get monthly payroll summary (CNSS and salary totals)' })
    @ApiQuery({ name: 'month', required: true, type: String, description: 'Month in YYYY-MM format' })
    @ApiQuery({ name: 'companyId', required: false, type: String })
    async getMonthlyPayrollSummary(@UserDecorator() user, @Query() query) {
        return this.employeeUseCases.getMonthlyPayrollSummary(user._id, query.month, query.companyId);
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

        return this.employeeUseCases.getAllEmployees(user._id, page, limit, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get employee by ID' })
    async getEmployeeById(@UserDecorator() user, @Param('id') id: string): Promise<Employee> {
        return this.employeeUseCases.getEmployeeById(user._id, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update employee' })
    async updateEmployee(
        @UserDecorator() user,
        @Param('id') id: string,
        @Body() dto: UpdateEmployeeDto
    ): Promise<Employee> {
        return this.employeeUseCases.updateEmployee(user._id, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete employee' })
    async deleteEmployee(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.employeeUseCases.deleteEmployee(user._id, id);
        return { success: result };
    }

    @Post('generate-monthly')
    @ApiOperation({ summary: 'Generate monthly salaries and CNSS payments' })
    async generateMonthlyPayroll(@UserDecorator() user, @Body() dto: GeneratePayrollDto) {
        return this.employeeUseCases.generateMonthlyPayroll(user._id, dto.month, dto.companyId);
    }
}
