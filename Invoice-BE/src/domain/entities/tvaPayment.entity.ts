import { Base } from './base.entity';

export class TvaPayment extends Base {
    month: string;
    amount: number;
    paymentDate: string;
    proofUrl?: string;
    notes?: string;
}
