import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { DesensitizationRules } from '../../common/utils/desensitization.util';

export class PreviewDesensitizeDto {
  @ApiProperty({ description: 'OCR版本ID', example: 1 })
  @IsNotEmpty({ message: 'OCR版本ID不能为空' })
  @IsNumber({}, { message: 'OCR版本ID必须是数字' })
  ocrVersionId: number;

  @ApiPropertyOptional({
    description: '脱敏规则配置，不传则使用默认规则',
    example: {
      name: true,
      idCard: true,
      phone: true,
      email: true,
      address: false,
      bankCard: false,
    },
  })
  @IsOptional()
  @IsObject({ message: '脱敏规则必须是对象' })
  rules?: DesensitizationRules;
}

export class ApplyDesensitizeDto {
  @ApiProperty({ description: 'OCR版本ID', example: 1 })
  @IsNotEmpty({ message: 'OCR版本ID不能为空' })
  @IsNumber({}, { message: 'OCR版本ID必须是数字' })
  ocrVersionId: number;

  @ApiPropertyOptional({
    description: '脱敏规则配置，不传则使用默认规则',
    example: {
      name: true,
      idCard: true,
      phone: true,
      email: true,
      address: false,
      bankCard: false,
    },
  })
  @IsOptional()
  @IsObject({ message: '脱敏规则必须是对象' })
  rules?: DesensitizationRules;
}
