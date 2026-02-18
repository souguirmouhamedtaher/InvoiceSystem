import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { TaxSettings } from 'src/domain/entities';
import { CreateTaxSettingsDto, UpdateTaxSettingsDto } from '../dtos';
import { TaxSettingsFactory } from '../factoryMapper';
import { Types } from 'mongoose';
import { Role } from 'src/domain/enums/role.enums';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';

type RequestUser = {
  _id: string;
  roles?: string[];
};

@Injectable()
export class TaxSettingsUseCases {
  constructor(
    private dataService: IDataServices,
    private taxSettingsFactory: TaxSettingsFactory
  ) {}

  async getAllTaxSettings(
    user: RequestUser,
    page: number = 1,
    limit: number = 20,
    search?: { [key: string]: any }
  ): Promise<{ taxSettings: TaxSettings[]; totalTaxSettings: number }> {
    const query: any = { deletedAt: null };
    const orQueries: any[] = [];
    const companyId = search?.companyId;

    if (!companyId) {
      throw new BadRequestException('companyId is required.');
    }
    await this.assertCompanyAccess(user, companyId);
    query.companyId = new Types.ObjectId(companyId);

    if (search) {
      for (const [key, value] of Object.entries(search)) {
        if (key === 'name' && typeof value === 'string') {
          orQueries.push({
            name: { $regex: value, $options: 'i' }
          });
        } else if (key === 'search' && typeof value === 'string') {
          const searchRegex = { $regex: value, $options: 'i' };
          orQueries.push({ name: searchRegex });
        } else if (key === 'isactive' && typeof value === 'boolean') {
          query.isactive = value;
        } else if (key === 'taxType' && value) {
          query.taxType = value;
        } else if (key === 'companyId') {
          // companyId already handled
        } else {
          query[key] = value;
        }
      }
    }

    const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
    const taxSettings = await this.dataService.TaxSettings.findAllByAttributeWithFilter(finalQuery, page, limit);
    const totalTaxSettings = await this.dataService.TaxSettings.count(finalQuery);

    return { taxSettings, totalTaxSettings };
  }

  async getTaxSettingsById(user: RequestUser, id: string): Promise<TaxSettings> {
    const taxSettings = await this.dataService.TaxSettings.get(id);
    if (!taxSettings) throw new NotFoundException('Tax settings not found.');
    const companyId = (taxSettings as any).companyId?._id ?? (taxSettings as any).companyId;
    if (companyId) {
      await this.assertCompanyAccess(user, companyId.toString());
    }
    return taxSettings;
  }

  async createTaxSettings(user: RequestUser, taxSettingsToCreate: CreateTaxSettingsDto): Promise<TaxSettings> {
    await this.assertCompanyAccess(user, taxSettingsToCreate.companyId);
    const taxSettings = this.taxSettingsFactory.createTaxSettings(taxSettingsToCreate);
    return await this.dataService.TaxSettings.create(taxSettings);
  }

  async updateTaxSettings(user: RequestUser, id: string, taxSettingsToUpdate: UpdateTaxSettingsDto): Promise<TaxSettings> {
    const existingTaxSettings = await this.dataService.TaxSettings.get(id);
    if (!existingTaxSettings) throw new NotFoundException('Tax settings not found.');

    const companyId = (existingTaxSettings as any).companyId?._id ?? (existingTaxSettings as any).companyId;
    if (companyId) {
      await this.assertCompanyAccess(user, companyId.toString());
    }

    const taxSettings = this.taxSettingsFactory.updateTaxSettings(taxSettingsToUpdate);
    return await this.dataService.TaxSettings.update(id, taxSettings);
  }

  async deleteTaxSettings(user: RequestUser, id: string): Promise<boolean> {
    const taxSettings = await this.dataService.TaxSettings.get(id);
    if (!taxSettings) throw new NotFoundException('Tax settings not found.');

    const companyId = (taxSettings as any).companyId?._id ?? (taxSettings as any).companyId;
    if (companyId) {
      await this.assertCompanyAccess(user, companyId.toString());
    }

    return await this.dataService.TaxSettings.delete(id);
  }

  /**
   * Get active tax settings only
   */
  async getActiveTaxSettings(user: RequestUser, companyId: string): Promise<TaxSettings[]> {
    if (!companyId) {
      throw new BadRequestException('companyId is required.');
    }
    await this.assertCompanyAccess(user, companyId);
    return await this.dataService.TaxSettings.findAllByAttributeWithFilter(
      { deletedAt: null, companyId: new Types.ObjectId(companyId), isactive: true },
      1,
      1000
    );
  }

  private isAdmin(roles?: string[]): boolean {
    return roles?.includes(Role.SUPERADMIN) ?? false;
  }

  private async assertCompanyAccess(user: RequestUser, companyId: string): Promise<void> {
    if (this.isAdmin(user.roles)) return;

    const owned = await this.dataService.company.findAllByAttributeWithFilter(
      { _id: new Types.ObjectId(companyId), userId: new Types.ObjectId(user._id) },
      1,
      1
    );

    if (owned?.length) return;

    const membership = await this.dataService.companyMembership.findAllByAttributeWithFilter(
      {
        deletedAt: null,
        userId: new Types.ObjectId(user._id),
        companyId: new Types.ObjectId(companyId),
      },
      1,
      1
    );

    if (!membership?.length) {
      throw new ForbiddenException('Access denied.');
    }

    const role = (membership[0].role as string)?.toLowerCase?.() ?? membership[0].role;
    if (role !== CompanyRole.ACCOUNTANT) {
      throw new ForbiddenException('Insufficient role for this action.');
    }
  }
}
