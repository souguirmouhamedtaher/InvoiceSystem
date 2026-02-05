import { PartialType } from '@nestjs/swagger';
import { CreateSalaryDto } from './createSalary.dto';

export class UpdateSalaryDto extends PartialType(CreateSalaryDto) {}
