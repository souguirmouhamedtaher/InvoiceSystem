import { Base } from './base.entity';

export class Employee extends Base {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    cnssApplicable: boolean;
    notes?: string;
}
