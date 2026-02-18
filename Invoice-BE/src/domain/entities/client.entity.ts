import { Base } from './base.entity';

export class Client extends Base {
    companyId: any;
    name: string;
    email: string;
    address: string;
    phone: string;
    taxId?: string;
    notes?: string;
}
