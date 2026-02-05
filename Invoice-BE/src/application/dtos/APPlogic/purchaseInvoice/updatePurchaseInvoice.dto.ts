import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseInvoiceDto } from './createPurchaseInvoice.dto';

export class UpdatePurchaseInvoiceDto extends PartialType(CreatePurchaseInvoiceDto) { }
