import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CaseModule } from './case/case.module';
import { VolumeModule } from './volume/volume.module';
import { DocumentModule } from './document/document.module';
import { OcrModule } from './ocr/ocr.module';
import { SearchModule } from './search/search.module';
import { OcrTaskService } from './tasks/ocr.task';
import { Document } from './common/entities/document.entity';
import { OcrVersion } from './common/entities/ocr-version.entity';
import { AnnotationModule } from './annotation/annotation.module';
import { UserModule } from './user/user.module';
import { LogModule } from './log/log.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_DATABASE || 'arbitration_archive',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: process.env.LOG_LEVEL === 'debug',
      timezone: '+08:00',
      extra: {
        connectionLimit: 10,
      },
    }),
    TypeOrmModule.forFeature([Document, OcrVersion]),
    AuthModule,
    CaseModule,
    VolumeModule,
    DocumentModule,
    OcrModule,
    SearchModule,
    AnnotationModule,
    UserModule,
    LogModule,
  ],
  providers: [OcrTaskService],
})
export class AppModule {}
