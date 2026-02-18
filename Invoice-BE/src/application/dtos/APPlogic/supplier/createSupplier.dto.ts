import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
    @ApiProperty({ description: 'Enterprise company ID' })
    @IsMongoId()
    companyId: string;

    @ApiProperty({ description: 'Supplier name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Supplier email' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Supplier address' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ description: 'Supplier phone number' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiPropertyOptional({ description: 'Supplier tax identifier' })
    @IsOptional()
    @IsString()
    taxId?: string;

    @ApiPropertyOptional({ description: 'Optional notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
