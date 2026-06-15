import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnotationService } from './annotation.service';
import { AnnotationController } from './annotation.controller';
import { Annotation } from '../common/entities/annotation.entity';
import { Document } from '../common/entities/document.entity';
import { OcrVersion } from '../common/entities/ocr-version.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Annotation, Document, OcrVersion, User]),
  ],
  controllers: [AnnotationController],
  providers: [AnnotationService],
  exports: [AnnotationService],
})
export class AnnotationModule {}
