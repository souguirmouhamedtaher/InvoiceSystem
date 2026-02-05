import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateSalaryDto {
    @ApiProperty({ description: 'Employee ID', example: '64b7c0f1a2b4c3d4e5f67890' })
    @IsMongoId()
    employeeId: string;

    @ApiProperty({ description: 'Salary month (YYYY-MM)', example: '2026-02' })
    @IsString()
    @Matches(/^\d{4}-\d{2}$/)
    month: string;

    @ApiProperty({ description: 'Net salary amount', example: 1500 })
    @IsNumber()
    @Min(0)
    netAmount: number;

    @ApiPropertyOptional({ description: 'Paid date (YYYY-MM-DD)', example: '2026-02-28' })
    @IsOptional()
    @IsString()
    paidDate?: string;

    @ApiPropertyOptional({ description: 'Is salary paid', example: true })
    @IsOptional()
    @IsBoolean()
    isPaid?: boolean;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
