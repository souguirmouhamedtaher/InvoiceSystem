import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { productType, unity, discountType } from 'src/domain/enums/libelle.enums';

export class CreateLibelleDto {
  @ApiProperty({ description: 'Label or product name', example: 'Web development service' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the item', example: 'Frontend and backend work' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsNumber()
  qte: number;

  @ApiProperty({ description: 'Product type', example: productType.service })
  @IsEnum(productType)
  productType?: productType;

  @ApiProperty({ description: 'Unity for the product', example: unity.hours })
  @IsEnum(unity)
  unity?: unity;

  @ApiPropertyOptional({ description: 'Unit price (HT)', example: '1000.00' })
  @IsOptional()
  @IsString()
  prixHT?: string;

  @ApiPropertyOptional({ description: 'Unit price (TTC)', example: '1190.00' })
  @IsOptional()
  @IsString()
  prixTTC?: string;

  @ApiPropertyOptional({ description: 'Discount amount (absolute)', example: 0 })
  @IsOptional()
  @IsNumber()
  amount_discount?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 0 })
  @IsOptional()
  @IsNumber()
  percentage_discount?: number;

  @ApiPropertyOptional({ description: 'Discount type', example: discountType.amount })
  @IsOptional()
  @IsEnum(discountType)
  discountType?: discountType;

  @ApiPropertyOptional({ description: 'Tax settings id (ObjectId) to reference an existing tax', example: '64...' })
  @IsOptional()
  @IsString()
  TexSettingsId?: string;

  @ApiPropertyOptional({ description: 'Final total price HT after discounts (optional, system can compute)', example: '1000.00' })
  @IsOptional()
  @IsString()
  finalprixHT?: string;

  @ApiProperty({ description: 'Final total price TTC after discounts (optional, system can compute)', example: '1190.00' })
  @IsString()
  finalprixTTC?: string;
}
