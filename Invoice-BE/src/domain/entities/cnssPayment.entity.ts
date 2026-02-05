import { Base } from './base.entity';

export class CnssPayment extends Base {
    employeeId: any;
    month: string;
    amount: number;
    paymentDate: string;
    notes?: string;
}
