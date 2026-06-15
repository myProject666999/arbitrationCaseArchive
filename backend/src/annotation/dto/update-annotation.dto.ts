import { PartialType } from '@nestjs/swagger';
import { CreateAnnotationDto } from './create-annotation.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateAnnotationDto extends PartialType(CreateAnnotationDto) {
  @ApiProperty({ description: '版本号（用于乐观锁控制', example: 1 })
  @IsNotEmpty({ message: '版本号不能为空' })
  @IsNumber({}, { message: '版本号必须是数字' })
  version: number;
}
