import { Base } from './base.entity';
import { companyType } from '../enums/company.enums';

export class Company extends Base {
    userId: any;
    companyname: string;
    companyType: companyType;
    logo: string;
    Patente: string;
    bankName: string;
    bankIBAN: string;
    bankRib: string;
    bankBIC: string;
    address: string;
    email: string;
    phones: string[];
    ResponsibleName: string;
    ResponsibleEmail: string;
    ResponsiblePhone: string;
    companySector: string;
    companySubSector: string;
    supplierType?: string;
    accountingEmail?: string;
    vatIncluded?: boolean;
    country: string;
    city: string;
    notes: string;
}
