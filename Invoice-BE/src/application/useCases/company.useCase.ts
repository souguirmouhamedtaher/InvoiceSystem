import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Company } from 'src/domain/entities';
import { CreateCompanyDto, UpdateCompanyDto } from '../dtos';
import { CompanyFactory } from '../factoryMapper';

@Injectable()
export class CompanyUseCases {
  constructor(
    private dataService: IDataServices,
    private companyFactory: CompanyFactory
  ) {}

  async getAllCompanies(
    page: number = 1,
    limit: number = 20,
    search?: { [key: string]: any }
  ): Promise<{ companies: Company[]; totalCompanies: number }> {
    const query: any = { deletedAt: null };
    const orQueries: any[] = [];

    if (search) {
      for (const [key, value] of Object.entries(search)) {
        if (['companyname', 'email', 'city', 'country'].includes(key) && typeof value === 'string') {
          orQueries.push({
            [key]: { $regex: value, $options: 'i' }
          });
        } else if (key === 'search' && typeof value === 'string') {
          const searchRegex = { $regex: value, $options: 'i' };
          orQueries.push({ companyname: searchRegex });
          orQueries.push({ email: searchRegex });
          orQueries.push({ city: searchRegex });
          orQueries.push({ ResponsibleName: searchRegex });
        } else if (key === 'companyType' && value) {
          query.companyType = value;
        } else {
          query[key] = value;
        }
      }
    }

    const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
    const companies = await this.dataService.company.findAllByAttributeWithFilter(finalQuery, page, limit);
    const totalCompanies = await this.dataService.company.count(finalQuery);

    return { companies, totalCompanies };
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.dataService.company.get(id);
    if (!company) throw new NotFoundException('Company not found.');
    return company;
  }

  async createCompany(companyToCreate: CreateCompanyDto): Promise<Company> {
    const company = this.companyFactory.createCompany(companyToCreate);

    // Check if company with same name or email already exists (case-insensitive)
    const nameRegex = new RegExp(`^${this.escapeRegExp(company.companyname)}$`, 'i');
    const companyExists = await this.dataService.company.findByAttribute('companyname', nameRegex);

    if (companyExists && !companyExists.deletedAt) {
      throw new ConflictException('Company with this name already exists.');
    }

    if (company.email) {
      const emailRegex = new RegExp(`^${this.escapeRegExp(company.email)}$`, 'i');
      const emailExists = await this.dataService.company.findByAttribute('email', emailRegex);
      if (emailExists && !emailExists.deletedAt) {
        throw new ConflictException('Company with this email already exists.');
      }
    }

    return await this.dataService.company.create(company);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async updateCompany(id: string, companyToUpdate: UpdateCompanyDto): Promise<Company> {
    const existingCompany = await this.dataService.company.get(id);
    if (!existingCompany) throw new NotFoundException('Company not found.');

    const company = this.companyFactory.updateCompany(companyToUpdate);

    if (company.companyname) {
      const nameRegex = new RegExp(`^${this.escapeRegExp(company.companyname)}$`, 'i');
      const companyExists = await this.dataService.company.findByAttribute('companyname', nameRegex);
      if (
        companyExists &&
        !companyExists.deletedAt &&
        String(companyExists._id) !== String(existingCompany._id)
      ) {
        throw new ConflictException('Company with this name already exists.');
      }
    }

    if (company.email) {
      const emailRegex = new RegExp(`^${this.escapeRegExp(company.email)}$`, 'i');
      const emailExists = await this.dataService.company.findByAttribute('email', emailRegex);
      if (
        emailExists &&
        !emailExists.deletedAt &&
        String(emailExists._id) !== String(existingCompany._id)
      ) {
        throw new ConflictException('Company with this email already exists.');
      }
    }

    return await this.dataService.company.update(id, company);
  }

  async deleteCompany(id: string): Promise<boolean> {
    const company = await this.dataService.company.get(id);
    if (!company) throw new NotFoundException('Company not found.');

    return await this.dataService.company.delete(id);
  }
}
