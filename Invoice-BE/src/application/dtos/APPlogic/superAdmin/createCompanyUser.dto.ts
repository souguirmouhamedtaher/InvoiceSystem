import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';

export class CreateCompanyUserDto {
    @ApiProperty({ description: 'Company ID' })
    @IsMongoId()
    companyId: string;

    @ApiProperty({ enum: CompanyRole })
    @IsEnum(CompanyRole)
    role: CompanyRole;

    @ApiProperty({ description: 'User email' })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ description: 'First name (required if user does not exist)' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({ description: 'Last name (required if user does not exist)' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({ description: 'Phone number' })
    @IsOptional()
    @IsString()
    phone?: string;
}
