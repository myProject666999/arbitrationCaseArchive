import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum AnnotationType {
  HIGHLIGHT = 'highlight',
  COMMENT = 'comment',
  BOOKMARK = 'bookmark',
}

export class CreateAnnotationDto {
  @ApiProperty({ description: '文档ID', example: 1 })
  @IsNotEmpty({ message: '文档ID不能为空' })
  @IsNumber({}, { message: '文档ID必须是数字' })
  documentId: number;

  @ApiPropertyOptional({ description: 'OCR版本ID', example: 1 })
  @IsOptional()
  @IsNumber({}, { message: 'OCR版本ID必须是数字' })
  ocrVersionId?: number;

  @ApiProperty({ description: '标注类型', enum: AnnotationType, example: AnnotationType.HIGHLIGHT })
  @IsNotEmpty({ message: '标注类型不能为空' })
  @IsEnum(AnnotationType, { message: '标注类型不正确' })
  annotationType: AnnotationType;

  @ApiProperty({ description: '标注内容', example: '这是一段重要内容' })
  @IsNotEmpty({ message: '标注内容不能为空' })
  @IsString({ message: '标注内容必须是字符串' })
  content: string;

  @ApiPropertyOptional({
    description: '页面位置信息',
    example: { page: 1, x: 100, y: 200, width: 300, height: 50 },
  })
  @IsOptional()
  @IsObject({ message: '页面位置必须是对象' })
  pagePosition?: Record<string, any>;
}
