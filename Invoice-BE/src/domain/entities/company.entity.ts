import { Base } from './base.entity';
export class Company extends Base {
    userId: any;
    companyname: string;
    Patente: string;
    bankName: string;
    bankIBAN: string;
    bankRib: string;
    bankBIC: string;
    bankAccountNumber?: string;
    bankOwnerIdentifier?: string;
    bankInstitutionCode?: string;
    bankInstitutionName?: string;
    bankBranchCode?: string;
    bankCountry?: string;
    address: string;
    email: string;
    phones: string[];
    region: string;
    country: string;
    notes: string;
}
