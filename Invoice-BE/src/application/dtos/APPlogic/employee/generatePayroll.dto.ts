import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, Matches } from 'class-validator';

export class GeneratePayrollDto {
    @ApiProperty({ description: 'Payroll month (YYYY-MM)', example: '2026-02' })
    @IsString()
    @Matches(/^\d{4}-\d{2}$/)
    month: string;

    @ApiPropertyOptional({ description: 'Company ID (mycompany)' })
    @IsOptional()
    @IsMongoId()
    companyId?: string;
}
