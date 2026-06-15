import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateVolumeDto {
  @ApiProperty({ description: '案件ID', example: 1 })
  @IsNotEmpty({ message: '案件ID不能为空' })
  @IsNumber({}, { message: '案件ID必须是数字' })
  caseId: number;

  @ApiProperty({ description: '卷册号', example: 1 })
  @IsNotEmpty({ message: '卷册号不能为空' })
  @IsNumber({}, { message: '卷册号必须是数字' })
  volumeNumber: number;

  @ApiProperty({ description: '卷册名称', example: '证据材料卷' })
  @IsNotEmpty({ message: '卷册名称不能为空' })
  @IsString({ message: '卷册名称必须是字符串' })
  volumeName: string;

  @ApiProperty({ description: '卷册描述', example: '包含证据材料和相关文件', required: false })
  @IsOptional()
  @IsString({ message: '卷册描述必须是字符串' })
  description?: string;
}
