import { Base } from './base.entity';

export class Employee extends Base {
    userId: any;
    companyId: any;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    cnssApplicable: boolean;
    monthlyNetSalary: number;
    cnssRatePercent?: number;
    notes?: string;
}
