import { Base } from './base.entity';
import { TaxType } from '../enums/tax.enums';

export class TaxSettings extends Base {
    companyId: any;
    name: string;
    taxType: TaxType;
    taxprice: number;
    isactive: boolean;
    notes: string;
}
