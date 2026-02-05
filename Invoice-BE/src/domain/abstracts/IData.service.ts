import { IRepository } from '.';
import { Files, User, Company, Invoice, Libelle, TaxSettings, PurchaseInvoice, Employee, Salary, CnssPayment } from '../entities';

export abstract class IDataServices {
    abstract user: IRepository<User>;
    abstract files: IRepository<Files>;
    abstract company: IRepository<Company>;
    abstract invoice: IRepository<Invoice>;
    abstract libelle: IRepository<Libelle>;
    abstract TaxSettings: IRepository<TaxSettings>;
    abstract purchaseInvoice: IRepository<PurchaseInvoice>;
    abstract employee: IRepository<Employee>;
    abstract salary: IRepository<Salary>;
    abstract cnssPayment: IRepository<CnssPayment>;
}