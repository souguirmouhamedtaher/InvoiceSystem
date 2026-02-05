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
import { CreateEmployeeDto, UpdateEmployeeDto } from '../../application/dtos';
import { Employee } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';

@ApiTags('Facturation|Employee')
@Controller('employee')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class EmployeeController {
    constructor(private employeeUseCases: EmployeeUseCases) {}

    @Post()
    @ApiOperation({ summary: 'Create a new employee' })
    async createEmployee(@Body() dto: CreateEmployeeDto): Promise<Employee> {
        return this.employeeUseCases.createEmployee(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all employees' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getAllEmployees(@Query() query): Promise<{ employees: Employee[]; totalEmployees: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const { page: _, limit: __, ...search } = query;

        return this.employeeUseCases.getAllEmployees(page, limit, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get employee by ID' })
    async getEmployeeById(@Param('id') id: string): Promise<Employee> {
        return this.employeeUseCases.getEmployeeById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update employee' })
    async updateEmployee(
        @Param('id') id: string,
        @Body() dto: UpdateEmployeeDto
    ): Promise<Employee> {
        return this.employeeUseCases.updateEmployee(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete employee' })
    async deleteEmployee(@Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.employeeUseCases.deleteEmployee(id);
        return { success: result };
    }
}
