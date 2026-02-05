import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { paymentType } from 'src/domain/enums/invoice.enums';

export class AddInvoicePaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 120.5 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment date (YYYY-MM-DD)', example: '2026-02-05' })
  @IsString()
  date: string;

  @ApiProperty({ description: 'Payment method', enum: paymentType })
  @IsEnum(paymentType)
  paymentType: paymentType;

  @ApiPropertyOptional({ description: 'Proof of payment URL' })
  @IsOptional()
  @IsString()
  proofUrl?: string;

  @ApiPropertyOptional({ description: 'Optional payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
