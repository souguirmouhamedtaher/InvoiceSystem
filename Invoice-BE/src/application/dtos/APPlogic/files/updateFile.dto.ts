import { PartialType } from "@nestjs/swagger";
import { CreateFilesDto } from "./createFile.dto";

export class UpdateFilesDto extends PartialType(CreateFilesDto) {
}