import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolumeService } from './volume.service';
import { VolumeController } from './volume.controller';
import { Volume } from '../common/entities/volume.entity';
import { Case } from '../common/entities/case.entity';
import { Document } from '../common/entities/document.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Volume, Case, Document, User])],
  controllers: [VolumeController],
  providers: [VolumeService],
  exports: [VolumeService],
})
export class VolumeModule {}
