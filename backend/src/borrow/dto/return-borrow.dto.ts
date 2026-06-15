import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ReturnBorrowDto {
  @ApiPropertyOptional({ description: '实际归还日期', example: '2024-01-18' })
  @IsOptional()
  @IsDateString({}, { message: '归还日期格式不正确' })
  returnDate?: string;

  @ApiPropertyOptional({ description: '归还备注', example: '文件完整归还' })
  @IsOptional()
  @IsString({ message: '归还备注必须是字符串' })
  remark?: string;
}
