import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateCnssPaymentDto {
    @ApiProperty({ description: 'Employee ID', example: '64b7c0f1a2b4c3d4e5f67890' })
    @IsMongoId()
    employeeId: string;

    @ApiProperty({ description: 'CNSS month (YYYY-MM)', example: '2026-02' })
    @IsString()
    @Matches(/^\d{4}-\d{2}$/)
    month: string;

    @ApiProperty({ description: 'CNSS amount', example: 300 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ description: 'Payment date (YYYY-MM-DD)', example: '2026-02-25' })
    @IsString()
    paymentDate: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
