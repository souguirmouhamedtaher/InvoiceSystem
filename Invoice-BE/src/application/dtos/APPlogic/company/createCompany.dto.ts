import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { companyType } from 'src/domain/enums/company.enums';

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

  @ApiProperty({ description: 'Type of company', example: companyType.client })
  @IsEnum(companyType)
  @IsNotEmpty()
  companyType: companyType;

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

  @ApiProperty({ description: 'Primary contact email for the company', example: 'contact@acme.tn' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Phones list', example: ['+21612345678', '+21698765432'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  phones: string[];

  @ApiPropertyOptional({ description: 'Responsible person name', example: 'Khaled Ben Ali' })
  @IsOptional()
  @IsString()
  ResponsibleName?: string;

  @ApiPropertyOptional({ description: 'Responsible person email', example: 'responsible@acme.tn' })
  @IsOptional()
  @IsString()
  ResponsibleEmail?: string;

  @ApiPropertyOptional({ description: 'Responsible person phone', example: '+21698765432' })
  @IsOptional()
  @IsString()
  ResponsiblePhone?: string;

  @ApiProperty({ description: 'Address', example: '12 Avenue Habib Bourguiba' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'Company sector', example: 'IT' })
  @IsOptional()
  @IsString()
  companySector?: string;

  @ApiPropertyOptional({ description: 'Company sub sector', example: 'Software' })
  @IsOptional()
  @IsString()
  companySubSector?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Tunisia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Tunis' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Notes about the company', example: 'Preferred supplier' })
  @IsOptional()
  @IsString()
  notes?: string;
}
