import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Case } from '../common/entities/case.entity';
import { OcrVersion } from '../common/entities/ocr-version.entity';
import { DesensitizedVersion } from '../common/entities/desensitized-version.entity';
import { Document } from '../common/entities/document.entity';
import { Volume } from '../common/entities/volume.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, OcrVersion, DesensitizedVersion, Document, Volume]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
