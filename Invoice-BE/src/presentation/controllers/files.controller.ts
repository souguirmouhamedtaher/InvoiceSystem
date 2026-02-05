import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, Get, Param, Delete, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { fileUploadPipes } from 'src/infrastructure/spaceStorage/fileValidationPipe.config';
import { ISpaceStorage } from '../../domain/abstracts/ISpaceStorage.service';
import { UserDecorator } from '../decorators/getUser.decorator';
import { AccessTokenGuard } from '../guards/accessToken.guard';

@ApiTags('alemni_App|files')
@Controller('files')
@UseGuards(AccessTokenGuard)
export class FilesController {
    constructor(private readonly spaceStorageService: ISpaceStorage) {}

    @Post()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiBearerAuth()
    async uploadFile(@UploadedFile(fileUploadPipes) file: Express.Multer.File, @UserDecorator() user) {
        // Log user data for debugging
        console.log('User data:', user);

        if (!user || !user._id) {
            throw new UnauthorizedException('Invalid user data: _id is missing');
        }

        const { _id } = user;
        // Generate a unique fileid to avoid conflicts
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        // Construct key as _id/unique-filename (filetype is added by SpaceStorageService)
        const fileid = `${_id}/${uniqueSuffix}-${file.originalname}`;

        const url = await this.spaceStorageService.uploadFile(file, fileid);
        return { url };
    }

    @Get(':type/:userid')
    @ApiBearerAuth()
    async readFile(@UserDecorator() user, @Param('type') type: string, @Param('userid') fileid: string) {
        // Log user data for debugging
        console.log('User data:', user);

        if (!user || !user._id) {
            throw new UnauthorizedException('Invalid user data: _id is missing');
        }

        const { _id } = user;
        // Construct the full key as type/_id/userid
        const fullKey = `${type}/${_id}/${fileid}`;

        const fileUrl = await this.spaceStorageService.getFile(fullKey);
        return { url: fileUrl };
    }

    @Delete(':type/:userid/:filename')
    @ApiBearerAuth()
    async deleteFile(@UserDecorator() user, @Param('type') type: string, @Param('userid') userid: string) {
        // Log user data for debugging
        console.log('User data:', user);

        if (!user || !user._id) {
            throw new UnauthorizedException('Invalid user data: _id is missing');
        }

        const { _id } = user;
        // Construct the full key as type/_id/filename
        const fullKey = `${type}/${_id}/${userid}`;

        const result = await this.spaceStorageService.deleteFile(fullKey);
        return { message: result };
    }
}