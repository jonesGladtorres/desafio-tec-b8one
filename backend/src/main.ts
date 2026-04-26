import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const versionHeader = configService.get<string>(
    'API_VERSION_HEADER',
    'X-API-Version',
  );
  const corsOrigin = configService.get<string>('CORS_ORIGIN');

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin ?? false,
    credentials: true,
  });
  app.enableShutdownHooks();
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: versionHeader,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portal de Agendamento de Exames API')
    .setDescription('REST API for exams and appointments.')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: versionHeader,
        in: 'header',
        description: 'API version header. Use "1" for this release.',
      },
      'api-version',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}
void bootstrap();
