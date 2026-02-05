import { FileTypeValidator, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';

export const fileUploadPipes = new ParseFilePipe({
    validators: [
        new MaxFileSizeValidator({ maxSize: 300 * 1024 * 1024 }), // 300MB
        new FileTypeValidator({
            // Match mimetypes for allowed file types
            fileType: /^(image\/(jpg|jpeg|png|gif|bmp|tiff|webp)|audio\/(mpeg|wav|ogg|mp4)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/i,
        }),
    ],
});