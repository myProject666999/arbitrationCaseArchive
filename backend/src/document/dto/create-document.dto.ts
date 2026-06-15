import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { OcrStatus } from '../../common/entities/document.entity';

export class CreateDocumentDto {
  @ApiProperty({ description: '卷册ID', example: 1 })
  @IsNotEmpty({ message: '卷册ID不能为空' })
  @IsNumber({}, { message: '卷册ID必须是数字' })
  volumeId: number;

  @ApiProperty({ description: '文件名称', example: '仲裁申请书.pdf' })
  @IsNotEmpty({ message: '文件名称不能为空' })
  @IsString({ message: '文件名称必须是字符串' })
  documentName: string;

  @ApiPropertyOptional({ description: '文件类型', example: 'pdf' })
  @IsOptional()
  @IsString({ message: '文件类型必须是字符串' })
  documentType?: string;

  @ApiPropertyOptional({ description: '文件路径', example: '/uploads/2024/01/xxx.pdf' })
  @IsOptional()
  @IsString({ message: '文件路径必须是字符串' })
  filePath?: string;

  @ApiPropertyOptional({ description: '文件大小（字节）', example: 1024000 })
  @IsOptional()
  @IsNumber({}, { message: '文件大小必须是数字' })
  fileSize?: number;

  @ApiPropertyOptional({ description: '页码', example: 10 })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  pageNumber?: number;

  @ApiPropertyOptional({ description: '扫描日期', example: '2024-01-15' })
  @IsOptional()
  @IsDateString({}, { message: '扫描日期格式不正确' })
  scanDate?: string;

  @ApiPropertyOptional({ description: 'OCR状态', enum: ['pending', 'processing', 'completed', 'failed'], example: 'pending' })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'], { message: 'OCR状态不正确' })
  ocrStatus?: OcrStatus;
}
