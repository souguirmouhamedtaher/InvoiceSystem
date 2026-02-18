import { Injectable } from '@nestjs/common';
import { Company } from 'src/domain/entities';
import { CreateCompanyDto, UpdateCompanyDto } from '../dtos';

@Injectable()
export class CompanyFactory {
  createCompany(createCompanyDto: CreateCompanyDto): Company {
    const newCompany = new Company();

    newCompany.companyname = createCompanyDto.companyname.trim();
    if (createCompanyDto.Patente) newCompany.Patente = createCompanyDto.Patente;
    if (createCompanyDto.bankName) newCompany.bankName = createCompanyDto.bankName;
    if (createCompanyDto.bankIBAN) newCompany.bankIBAN = createCompanyDto.bankIBAN;
    if (createCompanyDto.bankRib) newCompany.bankRib = createCompanyDto.bankRib;
    if (createCompanyDto.bankBIC) newCompany.bankBIC = createCompanyDto.bankBIC;
    if (createCompanyDto.bankAccountNumber) newCompany.bankAccountNumber = createCompanyDto.bankAccountNumber;
    if (createCompanyDto.bankOwnerIdentifier) newCompany.bankOwnerIdentifier = createCompanyDto.bankOwnerIdentifier;
    if (createCompanyDto.bankInstitutionCode) newCompany.bankInstitutionCode = createCompanyDto.bankInstitutionCode;
    if (createCompanyDto.bankInstitutionName) newCompany.bankInstitutionName = createCompanyDto.bankInstitutionName;
    if (createCompanyDto.bankBranchCode) newCompany.bankBranchCode = createCompanyDto.bankBranchCode;
    if (createCompanyDto.bankCountry) newCompany.bankCountry = createCompanyDto.bankCountry;
    if (createCompanyDto.address) newCompany.address = createCompanyDto.address.trim();
    if (createCompanyDto.email) newCompany.email = createCompanyDto.email.trim().toLowerCase();
    if (createCompanyDto.phones) newCompany.phones = createCompanyDto.phones;
    if (createCompanyDto.region) newCompany.region = createCompanyDto.region.trim();
    if (createCompanyDto.country) newCompany.country = createCompanyDto.country.trim();
    if (createCompanyDto.notes) newCompany.notes = createCompanyDto.notes.trim();
    
    newCompany.createdAt = new Date();
    newCompany.updatedAt = new Date();
    
    return newCompany;
  }

  updateCompany(updateCompanyDto: UpdateCompanyDto): Company {
    const updatedCompany = new Company();

    if (updateCompanyDto.companyname) updatedCompany.companyname = updateCompanyDto.companyname.trim();
    if (updateCompanyDto.Patente) updatedCompany.Patente = updateCompanyDto.Patente;
    if (updateCompanyDto.bankName) updatedCompany.bankName = updateCompanyDto.bankName;
    if (updateCompanyDto.bankIBAN) updatedCompany.bankIBAN = updateCompanyDto.bankIBAN;
    if (updateCompanyDto.bankRib) updatedCompany.bankRib = updateCompanyDto.bankRib;
    if (updateCompanyDto.bankBIC) updatedCompany.bankBIC = updateCompanyDto.bankBIC;
    if (updateCompanyDto.bankAccountNumber) updatedCompany.bankAccountNumber = updateCompanyDto.bankAccountNumber;
    if (updateCompanyDto.bankOwnerIdentifier) updatedCompany.bankOwnerIdentifier = updateCompanyDto.bankOwnerIdentifier;
    if (updateCompanyDto.bankInstitutionCode) updatedCompany.bankInstitutionCode = updateCompanyDto.bankInstitutionCode;
    if (updateCompanyDto.bankInstitutionName) updatedCompany.bankInstitutionName = updateCompanyDto.bankInstitutionName;
    if (updateCompanyDto.bankBranchCode) updatedCompany.bankBranchCode = updateCompanyDto.bankBranchCode;
    if (updateCompanyDto.bankCountry) updatedCompany.bankCountry = updateCompanyDto.bankCountry;
    if (updateCompanyDto.address) updatedCompany.address = updateCompanyDto.address.trim();
    if (updateCompanyDto.email) updatedCompany.email = updateCompanyDto.email.trim().toLowerCase();
    if (updateCompanyDto.phones) updatedCompany.phones = updateCompanyDto.phones;
    if (updateCompanyDto.region) updatedCompany.region = updateCompanyDto.region.trim();
    if (updateCompanyDto.country) updatedCompany.country = updateCompanyDto.country.trim();
    if (updateCompanyDto.notes) updatedCompany.notes = updateCompanyDto.notes.trim();
    
    updatedCompany.updatedAt = new Date();
    
    return updatedCompany;
  }
}
