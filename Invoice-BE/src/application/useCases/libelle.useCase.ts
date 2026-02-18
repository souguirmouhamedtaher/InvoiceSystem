import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Libelle, TaxSettings } from 'src/domain/entities';
import { CreateLibelleDto, UpdateLibelleDto } from '../dtos';
import { LibelleFactory } from '../factoryMapper';
import { Types } from 'mongoose';
import { Role } from 'src/domain/enums/role.enums';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';

type RequestUser = {
  _id: string;
  roles?: string[];
};

@Injectable()
export class LibelleUseCases {
  constructor(
    private dataService: IDataServices,
    private libelleFactory: LibelleFactory
  ) {}

  async getAllLibelles(
    user: RequestUser,
    page: number = 1,
    limit: number = 20,
    search?: { [key: string]: any }
  ): Promise<{ libelles: Libelle[]; totalLibelles: number }> {
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
        if (['name', 'description'].includes(key) && typeof value === 'string') {
          orQueries.push({
            [key]: { $regex: value, $options: 'i' }
          });
        } else if (key === 'search' && typeof value === 'string') {
          const searchRegex = { $regex: value, $options: 'i' };
          orQueries.push({ name: searchRegex });
          orQueries.push({ description: searchRegex });
        } else if (key === 'productType' && value) {
          query.productType = value;
        } else if (key === 'unity' && value) {
          query.unity = value;
        } else if (key === 'companyId') {
          // companyId already handled
        } else {
          query[key] = value;
        }
      }
    }

    const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
    const libelles = await this.dataService.libelle.findAllByAttributeWithFilter(finalQuery, page, limit);
    const totalLibelles = await this.dataService.libelle.count(finalQuery);

    return { libelles, totalLibelles };
  }

  async getLibelleById(user: RequestUser, id: string): Promise<Libelle> {
    const libelle = await this.dataService.libelle.get(id);
    if (!libelle) throw new NotFoundException('Libelle not found.');
    const companyId = (libelle as any).companyId?._id ?? (libelle as any).companyId;
    if (companyId) {
      await this.assertCompanyAccess(user, companyId.toString());
    }
    return libelle;
  }

  async createLibelle(user: RequestUser, libelleToCreate: CreateLibelleDto): Promise<Libelle> {
    await this.assertCompanyAccess(user, libelleToCreate.companyId);
    // Get tax settings to calculate prices correctly
    let taxprice = 0;
    if (libelleToCreate.TexSettingsId) {
      const taxSettings = await this.dataService.TaxSettings.get(libelleToCreate.TexSettingsId);
      if (!taxSettings) {
        throw new NotFoundException('Tax settings not found.');
      }
      if (String((taxSettings as any).companyId) !== String(libelleToCreate.companyId)) {
        throw new BadRequestException('Tax settings do not belong to this company.');
      }
      taxprice = taxSettings.taxprice;
    }

    const libelle = this.libelleFactory.createLibelle(libelleToCreate, taxprice);
    return await this.dataService.libelle.create(libelle);
  }

  async updateLibelle(user: RequestUser, id: string, libelleToUpdate: UpdateLibelleDto): Promise<Libelle> {
    const existingLibelle = await this.dataService.libelle.get(id);
    if (!existingLibelle) throw new NotFoundException('Libelle not found.');

    const existingCompanyId = typeof existingLibelle.companyId === 'object'
      ? (existingLibelle.companyId as any)?._id?.toString?.() || existingLibelle.companyId.toString()
      : String(existingLibelle.companyId);

    await this.assertCompanyAccess(user, existingCompanyId);

    // Get tax settings to recalculate prices if needed
    let taxprice = 0;
    let taxSettingsIdString: string | undefined;
    
    if (libelleToUpdate.TexSettingsId) {
      taxSettingsIdString = libelleToUpdate.TexSettingsId;
    } else if (existingLibelle.TaxSettingsId) {
      // Handle populated or non-populated TaxSettingsId
      taxSettingsIdString = typeof existingLibelle.TaxSettingsId === 'object' 
        ? (existingLibelle.TaxSettingsId as any)._id?.toString() || (existingLibelle.TaxSettingsId as any).toString()
        : existingLibelle.TaxSettingsId.toString();
    }
    
    if (taxSettingsIdString) {
      const taxSettings = await this.dataService.TaxSettings.get(taxSettingsIdString);
      if (!taxSettings) {
        throw new NotFoundException('Tax settings not found.');
      }
      if (String((taxSettings as any).companyId) !== String(existingCompanyId)) {
        throw new BadRequestException('Tax settings do not belong to this company.');
      }
      taxprice = taxSettings.taxprice;
    }

    // Merge existing libelle data with update data for recalculation
    const mergedData: UpdateLibelleDto = {
      ...libelleToUpdate,
      prixHT: libelleToUpdate.prixHT || existingLibelle.prixHT,
      prixTTC: libelleToUpdate.prixTTC || existingLibelle.prixTTC,
      qte: libelleToUpdate.qte !== undefined ? libelleToUpdate.qte : existingLibelle.qte,
      amount_discount: libelleToUpdate.amount_discount !== undefined ? libelleToUpdate.amount_discount : existingLibelle.amount_discount,
      percentage_discount: libelleToUpdate.percentage_discount !== undefined ? libelleToUpdate.percentage_discount : existingLibelle.percentage_discount,
      discountType: libelleToUpdate.discountType || existingLibelle.discountType,
      TexSettingsId: taxSettingsIdString, // Pass the ID string, not the object
    };

    const libelle = this.libelleFactory.updateLibelle(mergedData, taxprice);
    return await this.dataService.libelle.update(id, libelle);
  }

  async deleteLibelle(user: RequestUser, id: string): Promise<boolean> {
    const libelle = await this.dataService.libelle.get(id);
    if (!libelle) throw new NotFoundException('Libelle not found.');

    const companyId = (libelle as any).companyId?._id ?? (libelle as any).companyId;
    if (companyId) {
      await this.assertCompanyAccess(user, companyId.toString());
    }

    return await this.dataService.libelle.delete(id);
  }

  private isAdmin(roles?: string[]): boolean {
    return roles?.includes(Role.SUPERADMIN) ?? false;
  }

  async assertCompanyAccess(user: RequestUser, companyId: string): Promise<void> {
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

  /**
   * Get libelles by multiple IDs - useful for invoice creation
   */
  async getLibellesByIds(ids: string[]): Promise<Libelle[]> {
    const libelles: Libelle[] = [];
    
    for (const id of ids) {
      const libelle = await this.dataService.libelle.get(id);
      if (libelle) {
        libelles.push(libelle);
      }
    }

    return libelles;
  }
}
