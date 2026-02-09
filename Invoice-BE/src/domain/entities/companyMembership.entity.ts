import { Base } from './base.entity';
import { CompanyRole } from '../enums/companyRole.enums';

export class CompanyMembership extends Base {
    userId: any;
    companyId: any;
    role: CompanyRole;
    createdBy?: any;
}
