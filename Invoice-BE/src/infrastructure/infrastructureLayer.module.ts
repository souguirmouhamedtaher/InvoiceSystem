import { Module } from '@nestjs/common';
import { BcryptModule } from './bcrypt/bcrypt.module';
import { MongoModule } from './database/mongo/mongo.module';
import { JwtModule } from './jwt/jwt.module';
import { MailMdoule } from './mail/mail.module';
import { SpaceStorageModule } from './spaceStorage/spaceStorage.module';
@Module({
    imports: [
        MongoModule,
        MailMdoule,
        BcryptModule,
        JwtModule,
        SpaceStorageModule,
    ],
    providers: [
    ],
    exports: [
        MongoModule,
        MailMdoule,
        BcryptModule,
        JwtModule,
        SpaceStorageModule,
    ]
})
export class InfrastructureLayerModule { }
