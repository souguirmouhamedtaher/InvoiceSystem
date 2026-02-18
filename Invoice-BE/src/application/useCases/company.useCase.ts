import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Company } from 'src/domain/entities';
import { CreateCompanyDto, UpdateCompanyDto } from '../dtos';
import { CompanyFactory } from '../factoryMapper';
import { Role } from 'src/domain/enums/role.enums';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';
import { Types } from 'mongoose';
import { SuperAdminUseCases } from './superAdmin.useCase';
import { AddCompanyMemberDto } from '../dtos/APPlogic/company/addCompanyMember.dto';

type RequestUser = {
  _id: string | Types.ObjectId;
  roles?: string[];
};

@Injectable()
export class CompanyUseCases {
  constructor(
    private dataService: IDataServices,
    private companyFactory: CompanyFactory,
    private superAdminUseCases: SuperAdminUseCases
  ) {}

  async getAllCompanies(
    user: RequestUser,
    page: number = 1,
    limit: number = 20,
    search?: { [key: string]: any }
  ): Promise<{ companies: Company[]; totalCompanies: number }> {
    const query: any = { deletedAt: null };
    if (!this.isAdmin(user.roles)) {
      query.userId = new Types.ObjectId(user._id);
    }
    const orQueries: any[] = [];

    if (search) {
      for (const [key, value] of Object.entries(search)) {
        if (['companyname', 'email', 'region', 'country'].includes(key) && typeof value === 'string') {
          orQueries.push({
            [key]: { $regex: value, $options: 'i' }
          });
        } else if (key === 'search' && typeof value === 'string') {
          const searchRegex = { $regex: value, $options: 'i' };
          orQueries.push({ companyname: searchRegex });
          orQueries.push({ email: searchRegex });
          orQueries.push({ region: searchRegex });
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

  private isAdmin(roles?: string[]): boolean {
    return Boolean(
      roles?.some((role) => {
        const lowered = role.toLowerCase();
        return lowered === Role.SUPERADMIN || lowered === 'superadmin';
      })
    );
  }


  async getCompanyById(user: RequestUser, id: string): Promise<Company> {
    const company = await this.dataService.company.get(id);
    if (!company) throw new NotFoundException('Company not found.');
    if (!this.isAdmin(user.roles) && company.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('Access denied');
    }
    return company;
  }

  async createCompany(user: RequestUser, companyToCreate: CreateCompanyDto): Promise<Company> {
    if (!user?._id) {
      throw new ForbiddenException('User is required to create a company.');
    }
    const company = this.companyFactory.createCompany(companyToCreate);
    company.userId = new Types.ObjectId(user._id);

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

  async updateCompany(user: RequestUser, id: string, companyToUpdate: UpdateCompanyDto): Promise<Company> {
    const existingCompany = await this.dataService.company.get(id);
    if (!existingCompany) throw new NotFoundException('Company not found.');
    if (!this.isAdmin(user.roles) && existingCompany.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('Access denied');
    }

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

  async deleteCompany(user: RequestUser, id: string): Promise<boolean> {
    const company = await this.dataService.company.get(id);
    if (!company) throw new NotFoundException('Company not found.');
    if (!this.isAdmin(user.roles) && company.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('Access denied');
    }

    return await this.dataService.company.delete(id);
  }

  private async assertCompanyOwnership(user: RequestUser, companyId: string): Promise<Company> {
    const company = await this.dataService.company.get(companyId);
    if (!company) throw new NotFoundException('Company not found.');
    if (!this.isAdmin(user.roles) && company.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('You do not own this company.');
    }
    return company;
  }

  async getCompanyMembers(user: RequestUser, companyId: string): Promise<{ memberships: any[]; total: number }> {
    await this.assertCompanyOwnership(user, companyId);
    const filter: any = { deletedAt: null, companyId: new Types.ObjectId(companyId) };
    const memberships = await this.dataService.companyMembership.findAllByAttributeWithFilter(filter, 1, 100);
    const total = memberships?.length ?? 0;
    return { memberships: memberships ?? [], total };
  }

  async addCompanyMember(user: RequestUser, companyId: string, payload: AddCompanyMemberDto): Promise<{ user: any; membershipId: string }> {
    await this.assertCompanyOwnership(user, companyId);
    return this.superAdminUseCases.createCompanyUser(
      { ...payload, companyId } as any,
      user._id.toString()
    );
  }

  async removeCompanyMembership(user: RequestUser, membershipId: string): Promise<void> {
    const membership = await this.dataService.companyMembership.get(membershipId);
    if (!membership) throw new NotFoundException('Membership not found.');
    const companyId = (membership.companyId as any)?._id ?? membership.companyId;
    await this.assertCompanyOwnership(user, companyId.toString());
    await this.dataService.auditLog.create({
      userId: user._id,
      companyId,
      action: 'COMPANY_USER_REMOVED',
      entityType: 'company_membership',
      entityId: membership._id,
      metadata: { targetUserId: membership.userId, role: membership.role },
    } as any);
    await this.dataService.companyMembership.delete(membershipId);
  }

  async getCompanyAuditLogs(
    user: RequestUser,
    companyId: string,
    page: number = 1,
    limit: number = 50,
    action?: string
  ): Promise<{ logs: any[]; total: number }> {
    const company = await this.dataService.company.get(companyId);
    if (!company) throw new NotFoundException('Company not found.');
    const isOwner = company.userId?.toString() === user._id?.toString();
    if (!this.isAdmin(user.roles) && !isOwner) {
      const memberships = await this.dataService.companyMembership.findAllByAttributeWithFilter(
        { deletedAt: null, userId: new Types.ObjectId(user._id), companyId: new Types.ObjectId(companyId) },
        1,
        1
      );
      if (!memberships?.length) throw new ForbiddenException('Access denied to this company audit log.');
      const role = (memberships[0].role as string)?.toLowerCase?.() ?? memberships[0].role;
      if (role !== CompanyRole.ACCOUNTANT) {
        throw new ForbiddenException('Access denied to this company audit log.');
      }
    }
    const filter: any = { deletedAt: null, companyId: new Types.ObjectId(companyId) };
    if (action) filter.action = action;
    const logs = await this.dataService.auditLog.findAllByAttributeWithFilter(filter, page, limit);
    return { logs: logs ?? [], total: logs?.length ?? 0 };
  }
}
