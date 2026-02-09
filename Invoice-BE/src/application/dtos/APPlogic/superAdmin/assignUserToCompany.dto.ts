import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { CompanyRole } from '../../../../domain/enums/companyRole.enums';

export class AssignUserToCompanyDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsMongoId()
  companyId: string;

  @IsNotEmpty()
  @IsEnum(CompanyRole)
  role: CompanyRole;
}
