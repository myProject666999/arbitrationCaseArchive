import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { Case } from '../common/entities/case.entity';
import { Volume } from '../common/entities/volume.entity';
import { Document } from '../common/entities/document.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Volume, Document, User])],
  controllers: [CaseController],
  providers: [CaseService],
  exports: [CaseService],
})
export class CaseModule {}
