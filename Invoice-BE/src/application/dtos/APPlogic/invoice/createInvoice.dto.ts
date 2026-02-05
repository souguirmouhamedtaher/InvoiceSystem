import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { clientType, invoiceStatus, devisType, invoiceType } from 'src/domain/enums/invoice.enums';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice username (payer or contact)', example: 'John Doe' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Date of invoice', example: '2025-11-07' })
  @IsString()
  dateInvoice: string;

  @ApiPropertyOptional({ description: 'Application or project name', example: 'truth' })
  @IsOptional()
  @IsString()
  applicationName?: string;

  @ApiProperty({ description: 'Client type (international/national)', example: 'national' })
  @IsEnum(clientType)
  clientType: clientType;

  @ApiPropertyOptional({ description: 'Invoice type (selling or buying)', example: 'selling' })
  @IsOptional()
  @IsEnum(invoiceType)
  invoiceType?: invoiceType;

  @ApiPropertyOptional({ description: 'Invoice status', example: 'draft' })
  @IsOptional()
  @IsEnum(invoiceStatus)
  invoiceStatus?: invoiceStatus;

  @ApiProperty({ description: 'Array of Libelle IDs (ObjectId strings) - frontend should send existing libelle ids', type: [String], example: ['64b7c0f1a2b4c3d4e5f67890'] })
  @IsArray()
  @IsString({ each: true })
  Libelle: string[];

  @ApiPropertyOptional({ description: 'Array of AdditionalTaxSettings IDs (ObjectId strings) - frontend should send existing tax setting ids', type: [String], example: ['64b7c0f1a2b4c3d4e5f67891'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  AdditionalTaxSettings?: string[];

  @ApiPropertyOptional({ description: 'Invoice number (optional, system may generate)', example: '2025-0004' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Total TTC (optional - can be computed)', example: '1190.00' })
  @IsOptional()
  @IsString()
  totalTTC?: string;

  @ApiPropertyOptional({ description: 'Total HT (optional - can be computed)', example: '1000.00' })
  @IsOptional()
  @IsString()
  totalHT?: string;


  @ApiPropertyOptional({ description: 'Total Tax (optional - can be computed)', example: '190.00' })
  @IsOptional()
  @IsString()
  totalTax?: string;

  @ApiPropertyOptional({ description: 'Type de devis (devise) for international invoices' })
  @IsOptional()
  @IsEnum(devisType)
  typeDevis?: devisType;

  @ApiPropertyOptional({ description: 'Montant international in foreign currency (numeric) e.g., 1000.00' })
  @IsOptional()
  @IsNumber()
  montantInternational?: number;

  @ApiPropertyOptional({ description: 'Taux de change à utiliser pour convertir montantInternational en DT (e.g., 3.3)' })
  @IsOptional()
  @IsNumber()
  tauxChange?: number;

  @ApiPropertyOptional({ description: 'Timbre (stamp duty) amount in DT, defaults to 1' })
  @IsOptional()
  @IsNumber()
  timbre?: number;

  @ApiPropertyOptional({ example: 'Used ramp on Ave Hédi Chaker' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Client ID (ObjectId string) - optional reference to client', example: '64b7c0f1a2b4c3d4e5f67892' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Supplier ID (ObjectId string) - optional reference to supplier', example: '64b7c0f1a2b4c3d4e5f67900' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'My Company ID (ObjectId string) - optional reference to company', example: '64b7c0f1a2b4c3d4e5f67893' })
  @IsOptional()
  @IsString()
  mycompanyId?: string;
}
