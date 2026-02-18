import { Base } from './base.entity';
import { Company } from './company.entity';
import { User } from './user.entity';
import { paymentType } from '../enums/invoice.enums';

export class TvaPayment extends Base {
    userId: User;
    companyId: Company;
    month: string;
    amount: number;
    paymentDate: string;
    proofUrl?: string;
    notes?: string;
    paymentType?: paymentType;
}
