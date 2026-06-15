import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { BorrowType } from '../../common/entities/borrow-record.entity';

export class CreateBorrowDto {
  @ApiProperty({ description: '文件ID', example: 1 })
  @IsNotEmpty({ message: '文件ID不能为空' })
  @IsNumber({}, { message: '文件ID必须是数字' })
  documentId: number;

  @ApiProperty({ description: '借阅类型', enum: ['view', 'download', 'export'], example: 'view' })
  @IsNotEmpty({ message: '借阅类型不能为空' })
  @IsEnum(['view', 'download', 'export'], { message: '借阅类型不正确，可选值：view, download, export' })
  borrowType: BorrowType;

  @ApiProperty({ description: '借阅理由', example: '案件审理需要查阅相关档案' })
  @IsOptional()
  @IsString({ message: '借阅理由必须是字符串' })
  borrowReason?: string;

  @ApiProperty({ description: '借阅日期', example: '2024-01-15' })
  @IsNotEmpty({ message: '借阅日期不能为空' })
  @IsDateString({}, { message: '借阅日期格式不正确' })
  borrowDate: string;

  @ApiProperty({ description: '预计归还日期', example: '2024-01-20' })
  @IsNotEmpty({ message: '预计归还日期不能为空' })
  @IsDateString({}, { message: '预计归还日期格式不正确' })
  dueDate: string;
}
