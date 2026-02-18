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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CompanyUseCases } from '../../application/useCases';
import { CreateCompanyDto, UpdateCompanyDto } from '../../application/dtos';
import { AddCompanyMemberDto } from '../../application/dtos/APPlogic/company/addCompanyMember.dto';
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
        return this.companyUseCases.createCompany(user, createCompanyDto);
    }

    @Get()
    @ApiBearerAuth()
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in company name, email, city, responsible name' })
    @ApiQuery({ name: 'region', required: false, type: String })
    @ApiQuery({ name: 'country', required: false, type: String })
    async getAllCompanies(@UserDecorator() user, @Query() query): Promise<{ companies: Company[]; totalCompanies: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;

        const { page: _, limit: __, ...search } = query;

        return await this.companyUseCases.getAllCompanies(user, page, limit, search);
    }

    @Get(':companyId/members')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List team members (owner or super admin)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getCompanyMembers(
        @UserDecorator() user,
        @Param('companyId') companyId: string
    ): Promise<{ memberships: any[]; total: number }> {
        return this.companyUseCases.getCompanyMembers(user, companyId);
    }

    @Post(':companyId/members')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add manager or accountant to company (owner or super admin)' })
    async addCompanyMember(
        @UserDecorator() user,
        @Param('companyId') companyId: string,
        @Body() payload: AddCompanyMemberDto
    ): Promise<{ user: any; membershipId: string }> {
        return this.companyUseCases.addCompanyMember(user, companyId, payload);
    }

    @Delete('memberships/:membershipId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove team member (owner or super admin)' })
    async removeCompanyMembership(
        @UserDecorator() user,
        @Param('membershipId') membershipId: string
    ): Promise<void> {
        return this.companyUseCases.removeCompanyMembership(user, membershipId);
    }

    @Get(':companyId/audit-logs')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get audit logs for company (owner or accountant)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'action', required: false, type: String })
    async getCompanyAuditLogs(
        @UserDecorator() user,
        @Param('companyId') companyId: string,
        @Query() query: { page?: string; limit?: string; action?: string }
    ): Promise<{ logs: any[]; total: number }> {
        const page = parseInt(query.page ?? '1', 10) || 1;
        const limit = parseInt(query.limit ?? '50', 10) || 50;
        return this.companyUseCases.getCompanyAuditLogs(user, companyId, page, limit, query.action);
    }

    @Get(':id')
    @ApiBearerAuth()
    async getCompanyById(@UserDecorator() user, @Param('id') id: string): Promise<Company> {
        return this.companyUseCases.getCompanyById(user, id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    async updateCompany(
        @UserDecorator() user,
        @Param('id') id: string,
        @Body() updateCompanyDto: UpdateCompanyDto
    ): Promise<Company> {
        return this.companyUseCases.updateCompany(user, id, updateCompanyDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteCompany(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.companyUseCases.deleteCompany(user, id);
        return { success: result };
    }
}
