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
import { ClientUseCases } from '../../application/useCases';
import { CreateClientDto, UpdateClientDto } from '../../application/dtos';
import { Client } from '../../domain/entities';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { UserDecorator } from '../decorators/getUser.decorator';

@ApiTags('Facturation|Clients')
@Controller('clients')
@UseGuards(AccessTokenGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class ClientController {
    constructor(private clientUseCases: ClientUseCases) {}

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a client' })
    async createClient(@UserDecorator() user, @Body() dto: CreateClientDto): Promise<Client> {
        return this.clientUseCases.createClient(user, dto);
    }

    @Get()
    @ApiBearerAuth()
    @ApiQuery({ name: 'companyId', required: true, type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getAllClients(@UserDecorator() user, @Query() query): Promise<{ clients: Client[]; totalClients: number }> {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const companyId = query.companyId;
        const { page: _, limit: __, companyId: ___, ...search } = query;
        return this.clientUseCases.getAllClients(user, companyId, page, limit, search);
    }

    @Get(':id')
    @ApiBearerAuth()
    async getClientById(@UserDecorator() user, @Param('id') id: string): Promise<Client> {
        return this.clientUseCases.getClientById(user, id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    async updateClient(@UserDecorator() user, @Param('id') id: string, @Body() dto: UpdateClientDto): Promise<Client> {
        return this.clientUseCases.updateClient(user, id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    async deleteClient(@UserDecorator() user, @Param('id') id: string): Promise<{ success: boolean }> {
        const result = await this.clientUseCases.deleteClient(user, id);
        return { success: result };
    }
}
