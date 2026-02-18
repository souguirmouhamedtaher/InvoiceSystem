import { IRepository } from '.';
import { Files, User, Company, Client, Supplier, Invoice, Libelle, TaxSettings, PurchaseInvoice, Employee, Salary, CnssPayment, TvaPayment, CompanyMembership, AuditLog, TtnSimulation } from '../entities';

export abstract class IDataServices {
    abstract user: IRepository<User>;
    abstract files: IRepository<Files>;
    abstract company: IRepository<Company>;
    abstract client: IRepository<Client>;
    abstract supplier: IRepository<Supplier>;
    abstract invoice: IRepository<Invoice>;
    abstract libelle: IRepository<Libelle>;
    abstract TaxSettings: IRepository<TaxSettings>;
    abstract purchaseInvoice: IRepository<PurchaseInvoice>;
    abstract employee: IRepository<Employee>;
    abstract salary: IRepository<Salary>;
    abstract cnssPayment: IRepository<CnssPayment>;
    abstract tvaPayment: IRepository<TvaPayment>;
    abstract companyMembership: IRepository<CompanyMembership>;
    abstract auditLog: IRepository<AuditLog>;
    abstract ttnSimulation: IRepository<TtnSimulation>;
}