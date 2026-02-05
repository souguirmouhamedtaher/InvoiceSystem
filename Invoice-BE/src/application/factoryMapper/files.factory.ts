import { Injectable } from "@nestjs/common";
import { Files } from "../../domain/entities/files.entity";
import { CreateFilesDto, UpdateFilesDto } from "../dtos";
import { Types } from "mongoose";

@Injectable()
export class FilesFactory {
    createNewFile(createFileDto: CreateFilesDto): Files {
        const newFile = new Files();
        newFile.fileName = createFileDto.fileName;
        newFile.uploadedBy = new Types.ObjectId (createFileDto.uploadedBy);
        newFile.fileUrl = createFileDto.fileUrl;
        newFile.fileRelatedType = createFileDto.fileRelatedType;
        newFile.createdAt = new Date();
        newFile.updatedAt = new Date();

        return newFile;
    }

    updateFile(updateFileDto: UpdateFilesDto): Files {
        const updatedFile = new Files();
        updatedFile.fileName = updateFileDto.fileName;
        updatedFile.uploadedBy = new Types.ObjectId(updateFileDto.uploadedBy);
        updatedFile.fileUrl = updateFileDto.fileUrl;
        updatedFile.fileRelatedType = updateFileDto.fileRelatedType;
        updatedFile.updatedAt = new Date();

        return updatedFile;
    }
}