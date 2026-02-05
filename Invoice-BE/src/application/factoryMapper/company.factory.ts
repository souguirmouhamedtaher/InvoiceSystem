import { Injectable } from '@nestjs/common';
import { Company } from 'src/domain/entities';
import { CreateCompanyDto, UpdateCompanyDto } from '../dtos';

@Injectable()
export class CompanyFactory {
  createCompany(createCompanyDto: CreateCompanyDto): Company {
    const newCompany = new Company();

    newCompany.companyname = createCompanyDto.companyname.trim();
    newCompany.companyType = createCompanyDto.companyType;
    if (createCompanyDto.logo) newCompany.logo = createCompanyDto.logo;
    if (createCompanyDto.Patente) newCompany.Patente = createCompanyDto.Patente;
    if (createCompanyDto.bankName) newCompany.bankName = createCompanyDto.bankName;
    if (createCompanyDto.bankIBAN) newCompany.bankIBAN = createCompanyDto.bankIBAN;
    if (createCompanyDto.bankRib) newCompany.bankRib = createCompanyDto.bankRib;
    if (createCompanyDto.bankBIC) newCompany.bankBIC = createCompanyDto.bankBIC;
    if (createCompanyDto.address) newCompany.address = createCompanyDto.address.trim();
    if (createCompanyDto.email) newCompany.email = createCompanyDto.email.trim().toLowerCase();
    if (createCompanyDto.phones) newCompany.phones = createCompanyDto.phones;
    if (createCompanyDto.ResponsibleName) newCompany.ResponsibleName = createCompanyDto.ResponsibleName.trim();
    if (createCompanyDto.ResponsibleEmail) newCompany.ResponsibleEmail = createCompanyDto.ResponsibleEmail.trim().toLowerCase();
    if (createCompanyDto.ResponsiblePhone) newCompany.ResponsiblePhone = createCompanyDto.ResponsiblePhone.trim();
    if (createCompanyDto.companySector) newCompany.companySector = createCompanyDto.companySector.trim();
    if (createCompanyDto.companySubSector) newCompany.companySubSector = createCompanyDto.companySubSector.trim();
    if (createCompanyDto.supplierType) newCompany.supplierType = createCompanyDto.supplierType.trim();
    if (createCompanyDto.accountingEmail) newCompany.accountingEmail = createCompanyDto.accountingEmail.trim().toLowerCase();
    if (createCompanyDto.vatIncluded !== undefined) newCompany.vatIncluded = createCompanyDto.vatIncluded;
    if (createCompanyDto.country) newCompany.country = createCompanyDto.country.trim();
    if (createCompanyDto.city) newCompany.city = createCompanyDto.city.trim();
    if (createCompanyDto.notes) newCompany.notes = createCompanyDto.notes.trim();
    
    newCompany.createdAt = new Date();
    newCompany.updatedAt = new Date();
    
    return newCompany;
  }

  updateCompany(updateCompanyDto: UpdateCompanyDto): Company {
    const updatedCompany = new Company();

    if (updateCompanyDto.companyname) updatedCompany.companyname = updateCompanyDto.companyname.trim();
    if (updateCompanyDto.companyType) updatedCompany.companyType = updateCompanyDto.companyType;
    if (updateCompanyDto.logo) updatedCompany.logo = updateCompanyDto.logo;
    if (updateCompanyDto.Patente) updatedCompany.Patente = updateCompanyDto.Patente;
    if (updateCompanyDto.bankName) updatedCompany.bankName = updateCompanyDto.bankName;
    if (updateCompanyDto.bankIBAN) updatedCompany.bankIBAN = updateCompanyDto.bankIBAN;
    if (updateCompanyDto.bankRib) updatedCompany.bankRib = updateCompanyDto.bankRib;
    if (updateCompanyDto.bankBIC) updatedCompany.bankBIC = updateCompanyDto.bankBIC;
    if (updateCompanyDto.address) updatedCompany.address = updateCompanyDto.address.trim();
    if (updateCompanyDto.email) updatedCompany.email = updateCompanyDto.email.trim().toLowerCase();
    if (updateCompanyDto.phones) updatedCompany.phones = updateCompanyDto.phones;
    if (updateCompanyDto.ResponsibleName) updatedCompany.ResponsibleName = updateCompanyDto.ResponsibleName.trim();
    if (updateCompanyDto.ResponsibleEmail) updatedCompany.ResponsibleEmail = updateCompanyDto.ResponsibleEmail.trim().toLowerCase();
    if (updateCompanyDto.ResponsiblePhone) updatedCompany.ResponsiblePhone = updateCompanyDto.ResponsiblePhone.trim();
    if (updateCompanyDto.companySector) updatedCompany.companySector = updateCompanyDto.companySector.trim();
    if (updateCompanyDto.companySubSector) updatedCompany.companySubSector = updateCompanyDto.companySubSector.trim();
    if (updateCompanyDto.supplierType) updatedCompany.supplierType = updateCompanyDto.supplierType.trim();
    if (updateCompanyDto.accountingEmail) updatedCompany.accountingEmail = updateCompanyDto.accountingEmail.trim().toLowerCase();
    if (updateCompanyDto.vatIncluded !== undefined) updatedCompany.vatIncluded = updateCompanyDto.vatIncluded;
    if (updateCompanyDto.country) updatedCompany.country = updateCompanyDto.country.trim();
    if (updateCompanyDto.city) updatedCompany.city = updateCompanyDto.city.trim();
    if (updateCompanyDto.notes) updatedCompany.notes = updateCompanyDto.notes.trim();
    
    updatedCompany.updatedAt = new Date();
    
    return updatedCompany;
  }
}
