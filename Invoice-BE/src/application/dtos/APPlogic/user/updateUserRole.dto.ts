import { ApiProperty } from '@nestjs/swagger';
import {IsEnum } from 'class-validator';
import {Role } from 'src/domain/enums/role.enums';

export class UpdateUserRoleDto {    
    
    @ApiProperty()
    @IsEnum(Role)
    role: Role[];

}
