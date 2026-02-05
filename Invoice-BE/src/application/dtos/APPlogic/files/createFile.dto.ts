import { ApiProperty } from '@nestjs/swagger';
import {  IsEnum, IsString } from 'class-validator';
import { FilesType } from 'src/domain/enums/filesType.enums';

export class CreateFilesDto {
    @ApiProperty()
    @IsString()
    fileName: string;

    @ApiProperty()
    @IsString()
    uploadedBy: string;

    @ApiProperty()
    @IsString()
    fileUrl: string;

    @ApiProperty({enum:FilesType})
    @IsEnum(FilesType)
    fileRelatedType: FilesType;

}