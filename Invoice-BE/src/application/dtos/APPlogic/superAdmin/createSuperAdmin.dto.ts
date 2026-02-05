import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Role } from 'src/domain/enums/role.enums';

export class CreateSuperAdminDto {
    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsString()
    phone: string;


    @ApiProperty()
    @IsString()
     idNumber: string;

    @ApiProperty()
    @IsEnum(Role)
    role: Role[];

    @ApiPropertyOptional()
    @IsString()
    avatar: string;



}