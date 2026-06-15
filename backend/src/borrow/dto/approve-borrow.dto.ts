import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveBorrowDto {
  @ApiPropertyOptional({ description: '审批意见', example: '同意借阅' })
  @IsOptional()
  @IsString({ message: '审批意见必须是字符串' })
  remark?: string;
}
