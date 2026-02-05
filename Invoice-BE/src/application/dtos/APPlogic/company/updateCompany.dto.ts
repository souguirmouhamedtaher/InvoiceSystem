import { PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './createCompany.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
