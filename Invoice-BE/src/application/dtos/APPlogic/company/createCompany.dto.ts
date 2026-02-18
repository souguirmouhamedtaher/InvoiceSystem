import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'The official company name',
    example: 'Acme SARL',
  })
  @IsString()
  @IsNotEmpty()
  companyname: string;

  @ApiPropertyOptional({
    description: 'Company logo URL or path',
    example: 'https://cdn.example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Tax or registration number', example: 'PTE123456' })
  @IsOptional()
  @IsString()
  Patente?: string;

  @ApiPropertyOptional({ description: 'Bank name', example: 'Banque de Tunisie' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank IBAN', example: 'TN59100060351835984734' })
  @IsOptional()
  @IsString()
  bankIBAN?: string;

  @ApiPropertyOptional({ description: 'Bank RIB', example: '123456789' })
  @IsOptional()
  @IsString()
  bankRib?: string;

  @ApiPropertyOptional({ description: 'Bank BIC/SWIFT', example: 'BDBTTNTT' })
  @IsOptional()
  @IsString()
  bankBIC?: string;

  @ApiPropertyOptional({ description: 'Bank account number (Elfatoora AccountNumber)', example: '0120021241115530' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank account owner identifier (Elfatoora OwnerIdentifier)', example: '1B' })
  @IsOptional()
  @IsString()
  bankOwnerIdentifier?: string;

  @ApiPropertyOptional({ description: 'Bank institution code (Elfatoora InstitutionIdentification nameCode)', example: '0760' })
  @IsOptional()
  @IsString()
  bankInstitutionCode?: string;

  @ApiPropertyOptional({ description: 'Bank institution name (Elfatoora InstitutionName)', example: 'La poste' })
  @IsOptional()
  @IsString()
  bankInstitutionName?: string;

  @ApiPropertyOptional({ description: 'Bank branch code (Elfatoora BranchIdentifier)', example: '0760' })
  @IsOptional()
  @IsString()
  bankBranchCode?: string;

  @ApiPropertyOptional({ description: 'Bank country code (ISO 3166-1)', example: 'TN' })
  @IsOptional()
  @IsString()
  bankCountry?: string;

  @ApiProperty({ description: 'Primary contact email for the company', example: 'contact@acme.tn' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Phones list', example: ['+21612345678', '+21698765432'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  phones: string[];

  @ApiProperty({ description: 'Address', example: '12 Avenue Habib Bourguiba' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'Region', example: 'Tunis' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Tunisia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Notes about the company', example: 'Preferred supplier' })
  @IsOptional()
  @IsString()
  notes?: string;
}
