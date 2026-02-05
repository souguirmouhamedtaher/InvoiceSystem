import { PartialType } from "@nestjs/swagger";
import { CreateSuperAdminDto } from "./createSuperAdmin.dto";

export class UpdateSuperAdminDto extends PartialType(CreateSuperAdminDto) {
}

