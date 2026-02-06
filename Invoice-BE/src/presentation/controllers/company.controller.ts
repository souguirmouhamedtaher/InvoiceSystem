import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UsePipes,
    UseGuards
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CompanyUseCases } from '../../application/useCases';
import { CreateCompanyDto, UpdateCompanyDto } from '../../application/dtos';
import { Company } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { UserDecorator } from '../decorators/getUser.decorator';

@ApiTags('Facturation|Company')
@Controller('company')
@UseGuards(AccessTokenGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class CompanyController {
    constructor(private companyUseCases: CompanyUseCases) {}

    @Post()
    @ApiBearerAuth()
    async createCompany(@UserDecorator() user, @Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
        return this.companyUseCases.createCompany(user._id, createCompanyDto);
    }

    @Get()
    @ApiBearerAuth()
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in company name, email, city, responsible name' })
    @ApiQuery({ name: 'companyType', required: false, type: String, description: 'Filter by company type (mycompany/client)' })
    @ApiQuery({ name: 'city', required: false, type: String })
    @ApiQuery({ name: 'country', required: false, type: String })
    async getAllCompanies(@UserDecorator() user, @Query() query): Promise<{ companies: Company[]; totalCompanies: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;

        const { page: _, limit: __, ...search } = query;

        return await this.companyUseCases.getAllCompanies(user._id, page, limit, search);
    }

    @Get(':id')
    @ApiBearerAuth()
    async getCompanyById(@UserDecorator() user, @Param('id') id: string): Promise<Company> {
        return this.companyUseCases.getCompanyById(user._id, id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    async updateCompany(
        @UserDecorator() user,
        @Param('id') id: string,
        @Body() updateCompanyDto: UpdateCompanyDto
    ): Promise<Company> {
        return this.companyUseCases.updateCompany(user._id, id, updateCompanyDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteCompany(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.companyUseCases.deleteCompany(user._id, id);
        return { success: result };
    }
}
