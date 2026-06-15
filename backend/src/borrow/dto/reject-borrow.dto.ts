import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectBorrowDto {
  @ApiProperty({ description: '拒绝理由', example: '该文件涉及机密信息，暂不对外借阅' })
  @IsNotEmpty({ message: '拒绝理由不能为空' })
  @IsString({ message: '拒绝理由必须是字符串' })
  rejectionReason: string;
}
