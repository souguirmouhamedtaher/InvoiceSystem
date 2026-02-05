import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { MyLogger } from './infrastructure/logging/extended.logger';
import { ResponseInterceptor } from './presentation/interceptors/response.interceptor';
import tracer from './tracer';
import { join } from 'path';
import { SeedService } from './infrastructure/database/mongo/seed';

async function bootstrap() {
  await tracer.start()

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new MyLogger()
  });

  // register interceptor
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));

  // config object
  const configuration = app.get(ConfigService);

  // security headers
  //app.use(helmet());

  // server rendered admin web pages
  // app.useStaticAssets(join(__dirname, 'presentation', 'public'));
  // app.setBaseViewsDir(join(__dirname, 'presentation', 'views'));
  // app.setViewEngine('hbs');

  // CORS config
  app.enableCors({
    origin: "*",
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });

  // FILE UPLOAD config
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });

  // SWAGGER config - Available in all environments
  const options = new DocumentBuilder()
    .setTitle('Invoice API')
    .setDescription('Invoice Endpoints')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
      description: 'Enter your Bearer token',
    }, 'bearer')
    .setVersion('2.0')
    .build();

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });
  
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      security: [{ 'bearer': [] }],
    },
  });

  // launch seed service
  const seed = app.get(SeedService);
  await seed.seed();

  await app.listen(configuration.get<number>('port'));
}

bootstrap();
