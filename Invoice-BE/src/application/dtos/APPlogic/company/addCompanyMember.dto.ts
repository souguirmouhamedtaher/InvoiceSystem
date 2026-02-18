import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';

export class AddCompanyMemberDto {
    @ApiProperty({ enum: CompanyRole, description: 'MANAGER or ACCOUNTANT' })
    @IsEnum(CompanyRole)
    role: CompanyRole;

    @ApiProperty({ description: 'User email' })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ description: 'First name (required if new user)' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({ description: 'Last name (required if new user)' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({ description: 'Phone number' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Password for new user login (only for new users; leave empty to send a generated password by email)' })
    @IsOptional()
    @IsString()
    password?: string;
}
