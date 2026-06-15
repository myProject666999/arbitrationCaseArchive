import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesensitizationService } from './desensitization.service';
import { DesensitizationController } from './desensitization.controller';
import { OcrVersion } from '../common/entities/ocr-version.entity';
import { DesensitizedVersion } from '../common/entities/desensitized-version.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OcrVersion, DesensitizedVersion, User]),
  ],
  controllers: [DesensitizationController],
  providers: [DesensitizationService],
  exports: [DesensitizationService],
})
export class DesensitizationModule {}
