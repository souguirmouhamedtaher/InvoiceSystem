import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IDataServices, IRepository } from "../../../domain/abstracts";
import {
    User,
    type UserDocument,
    Files,
    FilesDocument,


} from "./models";
import { Company, CompanyDocument } from './models';
import { Invoice, InvoiceDocument } from './models';
import { Libelle, LibelleDocument } from './models';
import { TaxSettings, TaxSettingsDocument } from './models';
import { PurchaseInvoice, PurchaseInvoiceDocument } from './models';
import { Employee, EmployeeDocument } from './models';
import { Salary, SalaryDocument } from './models';
import { CnssPayment, CnssPaymentDocument } from './models';
import { TvaPayment, TvaPaymentDocument } from './models';
import { MongoGenericRepository } from "./repositories/mongo.repository";
@Injectable()
export class MongoDataServices
    implements IDataServices, OnApplicationBootstrap {
    user: MongoGenericRepository<User>;
    files: MongoGenericRepository<Files>;
    company: MongoGenericRepository<Company>;
    invoice: MongoGenericRepository<Invoice>;
    libelle: MongoGenericRepository<Libelle>;
    TaxSettings: MongoGenericRepository<TaxSettings>;
    purchaseInvoice: MongoGenericRepository<PurchaseInvoice>;
    employee: MongoGenericRepository<Employee>;
    salary: MongoGenericRepository<Salary>;
    cnssPayment: MongoGenericRepository<CnssPayment>;
    tvaPayment: MongoGenericRepository<TvaPayment>;



    constructor(
        @InjectModel(User.name) private UserRepository: Model<UserDocument>,
        @InjectModel(Files.name) private FilesRepository: Model<FilesDocument>,
        @InjectModel(Company.name) private CompanyRepository: Model<CompanyDocument>,
        @InjectModel(Invoice.name) private InvoiceRepository: Model<InvoiceDocument>,
        @InjectModel(Libelle.name) private LibelleRepository: Model<LibelleDocument>,
        @InjectModel(TaxSettings.name) private TaxSettingsRepository: Model<TaxSettingsDocument>,
        @InjectModel(PurchaseInvoice.name) private PurchaseInvoiceRepository: Model<PurchaseInvoiceDocument>,
        @InjectModel(Employee.name) private EmployeeRepository: Model<EmployeeDocument>,
        @InjectModel(Salary.name) private SalaryRepository: Model<SalaryDocument>,
        @InjectModel(CnssPayment.name) private CnssPaymentRepository: Model<CnssPaymentDocument>,
        @InjectModel(TvaPayment.name) private TvaPaymentRepository: Model<TvaPaymentDocument>,
    ) { }



    onApplicationBootstrap() {
        this.user = new MongoGenericRepository<User>(this.UserRepository);
        this.files = new MongoGenericRepository<Files>(this.FilesRepository, ["uploadedBy"]);
        this.company = new MongoGenericRepository<Company>(this.CompanyRepository);
        this.invoice = new MongoGenericRepository<Invoice>(
            this.InvoiceRepository,
            ["AdditionalTaxSettings", "Libelle", "clientId", "supplierId", "mycompanyId"]
        );
        this.libelle = new MongoGenericRepository<Libelle>(this.LibelleRepository, ["TaxSettingsId"]);
        this.TaxSettings = new MongoGenericRepository<TaxSettings>(this.TaxSettingsRepository);
        this.purchaseInvoice = new MongoGenericRepository<PurchaseInvoice>(this.PurchaseInvoiceRepository, ["companyId"]);
        this.employee = new MongoGenericRepository<Employee>(this.EmployeeRepository, ["companyId"]);
        this.salary = new MongoGenericRepository<Salary>(this.SalaryRepository, ["employeeId"]);
        this.cnssPayment = new MongoGenericRepository<CnssPayment>(this.CnssPaymentRepository, ["employeeId"]);
        this.tvaPayment = new MongoGenericRepository<TvaPayment>(this.TvaPaymentRepository);
    }
}
