import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { OcrStatus } from '../../common/entities/document.entity';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: '文件名称', example: '仲裁申请书_更新.pdf' })
  @IsOptional()
  @IsString({ message: '文件名称必须是字符串' })
  documentName?: string;

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

  @ApiPropertyOptional({ description: 'OCR状态', enum: ['pending', 'processing', 'completed', 'failed'], example: 'completed' })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'], { message: 'OCR状态不正确' })
  ocrStatus?: OcrStatus;

  @ApiPropertyOptional({ description: '最新OCR版本ID', example: 1 })
  @IsOptional()
  @IsNumber({}, { message: '最新OCR版本ID必须是数字' })
  latestOcrVersionId?: number;
}
