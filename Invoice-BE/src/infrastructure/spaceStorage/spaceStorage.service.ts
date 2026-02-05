import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISpaceStorage } from '../../domain/abstracts/ISpaceStorage.service';


@Injectable()
export class SpaceStorageService implements ISpaceStorage, OnModuleInit {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('spaceObject.bucket')
    this.s3 = new S3Client({
      forcePathStyle: true,
      endpoint: this.configService.get<string>('spaceObject.endpoint'),
      region: this.configService.get<string>('spaceObject.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('spaceObject.accessKeyId'),
        secretAccessKey: this.configService.get<string>('spaceObject.secretKey'),
      }
    });



  }


  async onModuleInit() {
    await this.enableCors();
  }

  async enableCors() {
    try {
      await this.s3.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
                AllowedOrigins: ['*'],
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        }),
      );
      console.log(`CORS enabled for bucket: ${this.bucket}`);
    } catch (error) {
      console.error('Error enabling CORS:', error);
    }
  }

  async uploadFile(file: Express.Multer.File, filename: string): Promise<string> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );
    } catch (error) {
      console.error('MinIO upload error:', error);
      throw error;
    }

    // You must expose MinIO publicly or via a proxy to serve files via URL
    return `${this.configService.get<string>('spaceObject.public_endpoint')}/${this.bucket}/${filename}`;
  }

  async deleteFile(filename: string): Promise<string> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: filename,
        }),
      );
    } catch (error) {
      console.error('MinIO delete error:', error);
      throw error;
    }

    return `${filename} deleted successfully`;
  }

  async getFile(filename: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filename,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

}
