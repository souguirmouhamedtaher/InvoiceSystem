import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { IDataServices } from "../../../domain/abstracts";
import {
  User, UserSchema,
  Files, FilesSchema,
  Company, CompanySchema,
  Invoice, InvoiceSchema,
  Libelle, LibelleSchema,
  TaxSettings, TaxSettingsSchema,
  PurchaseInvoice, PurchaseInvoiceSchema,
  Employee, EmployeeSchema,
  Salary, SalarySchema,
  CnssPayment, CnssPaymentSchema,
} from "./models";
import { MongoDataServices } from "./mongo.service";
import { SeedService } from "./seed";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongoConnectionString') + '?authSource=admin',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeatureAsync([
      { name: User.name, useFactory: () => UserSchema },
      { name: Files.name, useFactory: () => FilesSchema },
      { name: Company.name, useFactory: () => CompanySchema },
      { name: Invoice.name, useFactory: () => InvoiceSchema },
      { name: Libelle.name, useFactory: () => LibelleSchema },
      { name: TaxSettings.name, useFactory: () => TaxSettingsSchema },
      { name: PurchaseInvoice.name, useFactory: () => PurchaseInvoiceSchema },
      { name: Employee.name, useFactory: () => EmployeeSchema },
      { name: Salary.name, useFactory: () => SalarySchema },
      { name: CnssPayment.name, useFactory: () => CnssPaymentSchema },
    ]),
  ],


  providers: [
    {
      provide: IDataServices,
      useClass: MongoDataServices,
    },
    SeedService,
  ],
  exports: [IDataServices, SeedService],
})
export class MongoModule { }