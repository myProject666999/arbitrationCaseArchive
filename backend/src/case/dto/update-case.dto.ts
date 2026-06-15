import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class UpdateCaseDto {
  @ApiPropertyOptional({ description: '案件编号', example: 'ARB2024001' })
  @IsOptional()
  @IsString()
  caseNumber?: string;

  @ApiPropertyOptional({ description: '案件标题', example: '合同纠纷案' })
  @IsOptional()
  @IsString()
  caseTitle?: string;

  @ApiPropertyOptional({ description: '案件类型', example: '合同纠纷' })
  @IsOptional()
  @IsString()
  caseType?: string;

  @ApiPropertyOptional({ description: '案由', example: '买卖合同纠纷' })
  @IsOptional()
  @IsString()
  caseCause?: string;

  @ApiPropertyOptional({ description: '申请人', example: '张三' })
  @IsOptional()
  @IsString()
  applicant?: string;

  @ApiPropertyOptional({ description: '被申请人', example: '李四' })
  @IsOptional()
  @IsString()
  respondent?: string;

  @ApiPropertyOptional({ description: '案件日期', example: '2024-01-15' })
  @IsOptional()
  @IsDateString({}, { message: '案件日期格式不正确' })
  caseDate?: string;

  @ApiPropertyOptional({ description: '案件摘要', example: '本案系买卖合同纠纷...' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: '是否保密', example: false })
  @IsOptional()
  @IsBoolean()
  isConfidential?: boolean;
}
