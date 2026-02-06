import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateTvaPaymentDto {
    @ApiProperty({ description: 'TVA month (YYYY-MM)', example: '2026-02' })
    @IsString()
    @Matches(/^\d{4}-\d{2}$/)
    month: string;

    @ApiProperty({ description: 'TVA payment amount', example: 450 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ description: 'Payment date (YYYY-MM-DD)', example: '2026-02-28' })
    @IsString()
    paymentDate: string;

    @ApiPropertyOptional({ description: 'Proof URL' })
    @IsOptional()
    @IsString()
    proofUrl?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
