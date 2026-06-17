import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { OcrTaskService } from './tasks/ocr.task';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context, trace }) => {
        return `${timestamp} [${level}] [${context || 'Application'}]: ${message}${trace ? '\n' + trace : ''}`;
      }),
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.uncolorize(),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.uncolorize(),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('仲裁案件电子卷宗归档系统')
    .setDescription('仲裁案件电子卷宗归档系统API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 3000;
  const host = process.env.APP_HOST || '0.0.0.0';

  await app.listen(port, host);
  logger.log(`应用已启动: http://${host}:${port}`, 'Bootstrap');
  logger.log(`API文档: http://${host}:${port}/api/docs`, 'Bootstrap');

  const ocrTask = app.get(OcrTaskService);
  ocrTask.start();
  logger.log('OCR定时任务已启动', 'Bootstrap');
}

bootstrap();
