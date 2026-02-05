import { Injectable, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";
import { IDataServices } from "../../domain/abstracts";
import { Files } from "../../domain/entities/files.entity";
import { FilesFactory } from "../factoryMapper";
import { CreateFilesDto, UpdateFilesDto } from "../dtos";

@Injectable()
export class FilesUseCases {
    constructor(
        private dataService: IDataServices,
        private filesFactory: FilesFactory
    ) {}

    async getAllFiles(): Promise<Files[]> {
        return await this.dataService.files.getAll();
    }

    async getFileById(id: string): Promise<Files> {
        if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Invalid file ID.");
        const file = await this.dataService.files.get(id);
        if (!file) throw new NotFoundException("File not found.");
        return file;
    }

    async createFile(fileToCreate: CreateFilesDto): Promise<Files> {
        const file = this.filesFactory.createNewFile(fileToCreate);
        return await this.dataService.files.create(file);
    }

    async updateFile(
        id: string,
        fileToUpdate: UpdateFilesDto,
    ): Promise<Files> {
        if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Invalid file ID.");
        const file = this.filesFactory.updateFile(fileToUpdate);
        const updatedFile = await this.dataService.files.update(id, file);
        if (!updatedFile) throw new NotFoundException("File not found.");
        return updatedFile;
    }

    async deleteFile(id: string,): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Invalid file ID.");
        const result = await this.dataService.files.delete(id);
        if (!result) throw new NotFoundException("File not found.");
        return result;
    }
}