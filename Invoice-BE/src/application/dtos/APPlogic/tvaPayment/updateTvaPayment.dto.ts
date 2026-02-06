import { PartialType } from '@nestjs/swagger';
import { CreateTvaPaymentDto } from './createTvaPayment.dto';

export class UpdateTvaPaymentDto extends PartialType(CreateTvaPaymentDto) {}
