import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsBoolean, IsEnum } from 'class-validator';
import { paymentType, clientType } from 'src/domain/enums/invoice.enums';

export class CreatePurchaseInvoiceDto {
    @ApiProperty({ description: 'Name of the invoice', example: 'Server Hosting Jan 2026' })
    @IsString()
    invoiceName: string;

    @ApiProperty({ description: 'Company ID (ObjectId reference)', example: '64b7c0f1a2b4c3d4e5f67890' })
    @IsMongoId()
    companyId: string;

    @ApiProperty({ description: 'Supplier ID (ObjectId reference)', example: '64b7c0f1a2b4c3d4e5f67891' })
    @IsMongoId()
    supplierId: string;

    @ApiProperty({ description: 'Date of the invoice', example: '2026-01-02' })
    @IsString()
    date: string;

    @ApiProperty({ description: 'Amount HT', example: '100.000' })
    @IsString()
    amountHT: string;

    @ApiProperty({ description: 'TVA amount', example: '19.000' })
    @IsString()
    tva: string;

    @ApiProperty({ description: 'Amount TTC', example: '119.000' })
    @IsString()
    amountTTC: string;

    @ApiPropertyOptional({ description: 'URL of the uploaded invoice file' })
    @IsOptional()
    @IsString()
    file?: string;

    @ApiPropertyOptional({ description: 'Status of payment', default: false })
    @IsOptional()
    @IsBoolean()
    isPaid?: boolean;

    @ApiProperty({ description: 'Type of payment', enum: paymentType })
    @IsEnum(paymentType)
    paymentType: paymentType;

    @ApiProperty({ description: 'Nationality of the invoice', enum: clientType })
    @IsEnum(clientType)
    clientType: clientType;

    @ApiPropertyOptional({ description: 'Optional notes', example: 'Paid via bank transfer' })
    @IsOptional()
    @IsString()
    notes?: string;
}
