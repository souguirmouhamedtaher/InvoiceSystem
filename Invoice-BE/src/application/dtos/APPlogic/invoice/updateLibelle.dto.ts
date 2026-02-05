import { PartialType } from '@nestjs/swagger';
import { CreateLibelleDto } from './createLibelle.dto';

export class UpdateLibelleDto extends PartialType(CreateLibelleDto) {}
