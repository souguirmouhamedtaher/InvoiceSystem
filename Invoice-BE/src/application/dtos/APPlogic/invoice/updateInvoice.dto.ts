import { PartialType } from "@nestjs/swagger";
import { CreateInvoiceDto } from "./createInvoice.dto";

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
}