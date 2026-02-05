import { Base } from './base.entity';

export class Salary extends Base {
    employeeId: any;
    month: string;
    netAmount: number;
    paidDate?: string;
    isPaid?: boolean;
    notes?: string;
}
