import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { paymentType } from 'src/domain/enums/invoice.enums';

export class CreateTvaPaymentDto {
    @ApiProperty({ description: 'Company ID', example: '64b7c0f1a2b4c3d4e5f67890' })
    @IsMongoId()
    companyId: string;

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

    @ApiPropertyOptional({ description: 'Payment method', enum: paymentType })
    @IsOptional()
    @IsEnum(paymentType)
    paymentType?: paymentType;

    @ApiPropertyOptional({ description: 'Proof URL' })
    @IsOptional()
    @IsString()
    proofUrl?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
