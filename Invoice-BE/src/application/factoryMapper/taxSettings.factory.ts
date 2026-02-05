import { Injectable } from '@nestjs/common';
import { TaxSettings } from 'src/domain/entities';
import { CreateTaxSettingsDto, UpdateTaxSettingsDto } from '../dtos';

@Injectable()
export class TaxSettingsFactory {
  createTaxSettings(createTaxSettingsDto: CreateTaxSettingsDto): TaxSettings {
    const newTaxSettings = new TaxSettings();

    newTaxSettings.name = createTaxSettingsDto.name;
    newTaxSettings.taxType = createTaxSettingsDto.taxType;
    newTaxSettings.taxprice = createTaxSettingsDto.taxprice;
    if (createTaxSettingsDto.isactive !== undefined) {
      newTaxSettings.isactive = createTaxSettingsDto.isactive;
    } else {
      newTaxSettings.isactive = true; // Default to active
    }
    if (createTaxSettingsDto.notes) newTaxSettings.notes = createTaxSettingsDto.notes;

    newTaxSettings.createdAt = new Date();
    newTaxSettings.updatedAt = new Date();
    
    return newTaxSettings;
  }

  updateTaxSettings(updateTaxSettingsDto: UpdateTaxSettingsDto): TaxSettings {
    const updatedTaxSettings = new TaxSettings();

    if (updateTaxSettingsDto.name) updatedTaxSettings.name = updateTaxSettingsDto.name;
    if (updateTaxSettingsDto.taxType) updatedTaxSettings.taxType = updateTaxSettingsDto.taxType;
    if (updateTaxSettingsDto.taxprice !== undefined) updatedTaxSettings.taxprice = updateTaxSettingsDto.taxprice;
    if (updateTaxSettingsDto.isactive !== undefined) updatedTaxSettings.isactive = updateTaxSettingsDto.isactive;
    if (updateTaxSettingsDto.notes) updatedTaxSettings.notes = updateTaxSettingsDto.notes;
    
    updatedTaxSettings.updatedAt = new Date();
    
    return updatedTaxSettings;
  }
}
