import { PartialType } from '@nestjs/swagger';
import { CreateTaxSettingsDto } from './createTaxSettings.dto';

export class UpdateTaxSettingsDto extends PartialType(CreateTaxSettingsDto) {}
