import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
    @ApiProperty({ description: 'First name', example: 'Mohamed' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ description: 'Last name', example: 'Ben Ali' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiPropertyOptional({ description: 'Email address', example: 'mohamed@company.tn' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Phone number', example: '+21612345678' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ description: 'CNSS applicable', example: true })
    @IsBoolean()
    cnssApplicable: boolean;

    @ApiPropertyOptional({ description: 'Notes', example: 'Contrat CDI' })
    @IsOptional()
    @IsString()
    notes?: string;
}
