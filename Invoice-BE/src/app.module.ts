import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationLayerModule } from './application/applicationLayer.module';
import configuration from './infrastructure/config';
import { InfrastructureLayerModule } from './infrastructure/infrastructureLayer.module';
import { PresentationLayerModule } from './presentation/presentationLayer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configuration],
      //envFilePath: '.env.dev'
      // envFilePath: `${process.cwd()}/environments/.env.dev`,
      envFilePath:".env"
      //envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV}`
    }),
    ApplicationLayerModule,
    PresentationLayerModule,
    InfrastructureLayerModule
  ],
})
export class AppModule { }
