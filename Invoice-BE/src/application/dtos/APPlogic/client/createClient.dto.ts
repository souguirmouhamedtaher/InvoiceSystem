import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
    @ApiProperty({ description: 'Enterprise company ID' })
    @IsMongoId()
    companyId: string;

    @ApiProperty({ description: 'Client name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Client email' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Client address' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ description: 'Client phone number' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiPropertyOptional({ description: 'Client tax identifier' })
    @IsOptional()
    @IsString()
    taxId?: string;

    @ApiPropertyOptional({ description: 'Optional notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
