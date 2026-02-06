import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateEmployeeDto {
    @ApiProperty({ description: 'Company ID (mycompany)', example: '64b7c0f1a2b4c3d4e5f67890' })
    @IsMongoId()
    companyId: string;

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

    @ApiProperty({ description: 'Monthly net salary', example: 1800 })
    @IsNumber()
    @Min(0)
    monthlyNetSalary: number;

    @ApiPropertyOptional({ description: 'CNSS rate percent', example: 9.18 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    cnssRatePercent?: number;

    @ApiPropertyOptional({ description: 'Notes', example: 'Contrat CDI' })
    @IsOptional()
    @IsString()
    notes?: string;
}
