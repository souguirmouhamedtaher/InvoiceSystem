import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { TaxType } from 'src/domain/enums/tax.enums';

export class CreateTaxSettingsDto {
  @ApiProperty({ description: 'Name of the tax setting', example: 'TVA 19%' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tax type enum', example: TaxType.TVA })
  taxType: TaxType;

  @ApiProperty({ description: 'Tax value (e.g. 19 for 19%)', example: 19 })
  @IsNumber()
  taxprice: number;

  @ApiProperty({ description: 'Whether the tax is active', example: true })
  @IsOptional()
  @IsBoolean()
  isactive?: boolean;

  @ApiPropertyOptional({ description: 'Notes about this tax setting', example: 'Standard VAT' })
  @IsOptional()
  @IsString()
  notes?: string;
}
