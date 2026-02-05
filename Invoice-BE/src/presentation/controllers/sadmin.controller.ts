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
import {  SuperAdminUseCases, UserUseCases } from '../../application/useCases';
import { Role } from '../../domain/enums/role.enums';
import { Roles } from '../decorators/role.decorator';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { RolesGuard } from '../guards/role.guard';
import { UserDecorator } from '../decorators/getUser.decorator';
import { User } from 'src/domain/entities';
import { CreateSuperAdminDto, UpdateUserDto } from 'src/application/dtos';

@ApiTags('Super_Admin|sadmin')
@Controller('sadmin')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class SAdminController {
    constructor(
        private superAdminUseCases: SuperAdminUseCases,
        private userUseCase: UserUseCases
    ) { }

    @Post()
    @ApiBearerAuth()
    async inviteUser(
        @Body() createSuperAdminDto: CreateSuperAdminDto, // or CreateSuperAdminDto
        @UserDecorator() user
    ): Promise<User> {
        return this.superAdminUseCases.createSuperAdmin(createSuperAdminDto);
    }
    
    @Get('')
    @ApiBearerAuth()
    @ApiQuery({ name: 'role', required: false, enum: Role })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'firstName', required: false, type: String })
    @ApiQuery({ name: 'lastName', required: false, type: String })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'email', required: false, type: String })
    async getAllUsers(@UserDecorator() user, @Query() query): Promise<{ Users: User[], totalUsers: number }> {
        const role = query.role || undefined;
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;

    const { role: _, page: ___, limit: ____, ...search } = query;

    return await this.userUseCase.getAllUsers(role, page, limit, search);    }
    @Delete(':id')
    @ApiBearerAuth()
     async deleteUser(@Param('id') id: string) {
         return this.userUseCase.deleteUser(id);
 }

    @Get(':id')
    @ApiBearerAuth()

    async getUserId(@Param('id') id: string): Promise<User> {
        console.log(id)
        return this.userUseCase.getUserById(id);
    }

        @Patch(':id')
        @ApiBearerAuth()
        async editUser(@Param('id') id: string, @Body() payload: UpdateUserDto) {
            return this.userUseCase.updateUser(id, payload);
        } 
        
}
