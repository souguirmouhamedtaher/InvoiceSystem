import { PartialType } from '@nestjs/swagger';
import { CreateCnssPaymentDto } from './createCnssPayment.dto';

export class UpdateCnssPaymentDto extends PartialType(CreateCnssPaymentDto) {}
