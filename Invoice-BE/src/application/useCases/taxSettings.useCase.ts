import { Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { TaxSettings } from 'src/domain/entities';
import { CreateTaxSettingsDto, UpdateTaxSettingsDto } from '../dtos';
import { TaxSettingsFactory } from '../factoryMapper';

@Injectable()
export class TaxSettingsUseCases {
  constructor(
    private dataService: IDataServices,
    private taxSettingsFactory: TaxSettingsFactory
  ) {}

  async getAllTaxSettings(
    page: number = 1,
    limit: number = 20,
    search?: { [key: string]: any }
  ): Promise<{ taxSettings: TaxSettings[]; totalTaxSettings: number }> {
    const query: any = { deletedAt: null };
    const orQueries: any[] = [];

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

  async getTaxSettingsById(id: string): Promise<TaxSettings> {
    const taxSettings = await this.dataService.TaxSettings.get(id);
    if (!taxSettings) throw new NotFoundException('Tax settings not found.');
    return taxSettings;
  }

  async createTaxSettings(taxSettingsToCreate: CreateTaxSettingsDto): Promise<TaxSettings> {
    const taxSettings = this.taxSettingsFactory.createTaxSettings(taxSettingsToCreate);
    return await this.dataService.TaxSettings.create(taxSettings);
  }

  async updateTaxSettings(id: string, taxSettingsToUpdate: UpdateTaxSettingsDto): Promise<TaxSettings> {
    const existingTaxSettings = await this.dataService.TaxSettings.get(id);
    if (!existingTaxSettings) throw new NotFoundException('Tax settings not found.');

    const taxSettings = this.taxSettingsFactory.updateTaxSettings(taxSettingsToUpdate);
    return await this.dataService.TaxSettings.update(id, taxSettings);
  }

  async deleteTaxSettings(id: string): Promise<boolean> {
    const taxSettings = await this.dataService.TaxSettings.get(id);
    if (!taxSettings) throw new NotFoundException('Tax settings not found.');

    return await this.dataService.TaxSettings.delete(id);
  }

  /**
   * Get active tax settings only
   */
  async getActiveTaxSettings(): Promise<TaxSettings[]> {
    return await this.dataService.TaxSettings.findAllByAttribute('isactive', true);
  }
}
